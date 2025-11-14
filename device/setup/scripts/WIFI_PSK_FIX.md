# WiFi Password Special Characters Fix

## Problem

WiFi passwords containing special characters (e.g., `#`, `!`, `$`, `"`, `'`, etc.) were not being handled correctly when written directly to `wpa_supplicant.conf`. This caused connection failures because:

1. Special characters can be misinterpreted by shell or config parsers
2. WPA2-PSK requires passwords to be either:
   - Quoted correctly (complex and error-prone)
   - Pre-hashed using PBKDF2-HMAC-SHA1 (recommended)

## Solution

Implemented PSK hash generation using PBKDF2-HMAC-SHA1 algorithm, which is the standard for WPA2-PSK.

### Changes Made

#### 1. Created `generate_psk.py`
- Python script that generates WPA2-PSK hash from SSID and password
- Uses `hashlib.pbkdf2_hmac()` with:
  - Algorithm: SHA1
  - Iterations: 4096
  - Output: 32 bytes (256 bits) as 64 hex characters
- Validates input:
  - SSID: 1-32 characters
  - Password: 8-63 characters
- Returns: 64-character hexadecimal PSK hash

#### 2. Modified `configure_device.sh`
- Lines 65-83: Added PSK hash generation
- Calls `generate_psk.py` to hash the password
- Validates hash format (64 hex characters)
- Writes hashed PSK to `wpa_supplicant.conf` instead of plain password
- Error handling for hash generation failures

#### 3. Updated `install.sh`
- Lines 183-185: Added Python script copying
- Ensures `generate_psk.py` is installed to `/opt/turnotec/scripts/`
- Makes script executable

## Technical Details

### WPA2-PSK Hash Algorithm
```
PSK = PBKDF2(HMAC-SHA1, passphrase, ssid, 4096, 256)
```

### Generated wpa_supplicant.conf Format
**Before (insecure with special chars):**
```
network={
    ssid="MyNetwork"
    psk="#QuestaQui23!"
    key_mgmt=WPA-PSK
}
```

**After (secure with hash):**
```
network={
    ssid="MyNetwork"
    psk=be81854aaef330ca37006a51570d981e726ddb87eaaf0ccc67a04e3bf5668580
    key_mgmt=WPA-PSK
}
```

## Testing

Tested with various password types:
- ✅ Simple passwords: `Simple123`
- ✅ Complex passwords with special chars: `#QuestaQui23!`
- ✅ Extreme special chars: `Pa$$w0rd!@#%^&*()`
- ✅ Password validation (too short, too long)

## Benefits

1. **Security**: No plain passwords in wpa_supplicant.conf (though still in config.json)
2. **Compatibility**: Works with all valid WPA2-PSK characters
3. **Standards-compliant**: Uses official WPA2-PSK algorithm
4. **Error-proof**: No shell escaping issues
5. **Future-proof**: Same method used by `wpa_passphrase` utility

## Usage

The fix is automatic - users don't need to change anything. When they enter a WiFi password in the configuration form, it will be automatically hashed before being written to `wpa_supplicant.conf`.

## Files Modified

- `device/setup/scripts/generate_psk.py` (new)
- `device/setup/scripts/configure_device.sh` (modified)
- `device/install.sh` (modified)

## References

- WPA2-PSK specification: IEEE 802.11i
- PBKDF2: RFC 2898
- wpa_supplicant documentation: https://w1.fi/wpa_supplicant/
