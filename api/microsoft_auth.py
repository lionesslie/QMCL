"""QMCL — Microsoft / Xbox Live / XSTS / Minecraft auth chain."""
from __future__ import annotations

import time
from typing import Callable, Optional

import requests

from core.constants import (
    MS_CLIENT_ID, MS_AUTHORITY, MS_SCOPES,
    XBOX_AUTH_URL, XSTS_AUTH_URL, MC_AUTH_URL, MC_PROFILE_URL,
)


class AuthError(Exception):
    pass


# ── Step 1: Microsoft Device Code Flow ───────────────────────────────────────

def start_device_code_flow() -> dict:
    """Initiate device-code flow. Returns the msal device_flow dict."""
    try:
        import msal
    except ImportError as e:
        raise AuthError("msal is not installed") from e

    app = msal.PublicClientApplication(
        MS_CLIENT_ID,
        authority=MS_AUTHORITY,
    )
    flow = app.initiate_device_flow(scopes=MS_SCOPES)
    if "user_code" not in flow:
        raise AuthError(f"Device flow failed: {flow}")
    flow["_app"] = app          # store for polling
    return flow


def poll_device_code_flow(flow: dict,
                          status_cb: Optional[Callable[[str], None]] = None
                          ) -> dict:
    """Poll until user completes auth. Returns token result dict."""
    app = flow.pop("_app")
    if status_cb:
        status_cb("Waiting for Microsoft login…")
    result = app.acquire_token_by_device_flow(flow)
    if "access_token" not in result:
        err = result.get("error_description", result.get("error", "Unknown"))
        raise AuthError(f"Microsoft auth failed: {err}")
    return result


# ── Step 2: Xbox Live ─────────────────────────────────────────────────────────

def authenticate_xbox(ms_access_token: str) -> tuple[str, str]:
    """Returns (xbl_token, user_hash)."""
    payload = {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": f"d={ms_access_token}",
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT",
    }
    r = requests.post(XBOX_AUTH_URL, json=payload,
                      headers={"Content-Type": "application/json",
                                "Accept": "application/json"},
                      timeout=15)
    if r.status_code != 200:
        raise AuthError(f"XBL auth failed: {r.status_code}")
    data = r.json()
    token = data["Token"]
    uhs = data["DisplayClaims"]["xui"][0]["uhs"]
    return token, uhs


# ── Step 3: XSTS ─────────────────────────────────────────────────────────────

def authenticate_xsts(xbl_token: str) -> tuple[str, str]:
    """Returns (xsts_token, user_hash)."""
    payload = {
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [xbl_token],
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT",
    }
    r = requests.post(XSTS_AUTH_URL, json=payload,
                      headers={"Content-Type": "application/json",
                                "Accept": "application/json"},
                      timeout=15)
    if r.status_code != 200:
        xsts_err = r.json().get("XErr", r.status_code)
        msg = {
            2148916233: "No Xbox account linked to this Microsoft account.",
            2148916238: "Child account — parental approval required.",
        }.get(xsts_err, f"XSTS error: {xsts_err}")
        raise AuthError(msg)
    data = r.json()
    token = data["Token"]
    uhs = data["DisplayClaims"]["xui"][0]["uhs"]
    return token, uhs


# ── Step 4: Minecraft ─────────────────────────────────────────────────────────

def authenticate_minecraft(xsts_token: str, user_hash: str) -> tuple[str, float]:
    """Returns (mc_access_token, expires_at_timestamp)."""
    payload = {"identityToken": f"XBL3.0 x={user_hash};{xsts_token}"}
    r = requests.post(MC_AUTH_URL, json=payload,
                      headers={"Content-Type": "application/json"},
                      timeout=15)
    if r.status_code != 200:
        raise AuthError(f"MC auth failed: {r.status_code}")
    data = r.json()
    token = data["access_token"]
    expires_in = data.get("expires_in", 86400)
    return token, time.time() + expires_in


# ── Step 5: Minecraft profile ─────────────────────────────────────────────────

def fetch_minecraft_profile(mc_token: str) -> dict:
    """Returns dict with id, name, skins, capes."""
    r = requests.get(MC_PROFILE_URL,
                     headers={"Authorization": f"Bearer {mc_token}"},
                     timeout=15)
    if r.status_code == 404:
        raise AuthError("This account does not own Minecraft.")
    r.raise_for_status()
    return r.json()


# ── Full chain (convenience) ──────────────────────────────────────────────────

def full_microsoft_auth(ms_access_token: str,
                        status_cb: Optional[Callable[[str], None]] = None
                        ) -> dict:
    """Run the full chain and return account info dict."""
    if status_cb:
        status_cb("Authenticating with Xbox Live…")
    xbl_token, _ = authenticate_xbox(ms_access_token)

    if status_cb:
        status_cb("Getting XSTS token…")
    xsts_token, uhs = authenticate_xsts(xbl_token)

    if status_cb:
        status_cb("Logging into Minecraft…")
    mc_token, expires_at = authenticate_minecraft(xsts_token, uhs)

    if status_cb:
        status_cb("Fetching profile…")
    profile = fetch_minecraft_profile(mc_token)

    return {
        "access_token": mc_token,
        "expires_at": expires_at,
        "uuid": profile["id"],
        "username": profile["name"],
        "xuid": uhs,
    }
