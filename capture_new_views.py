import os
import subprocess
import time

pages = [
    'showcase',
    'dietary-plan',
    'summary',
    'trends',
    'food-drivers',
    'calendar',
    'products',
    'about'
]

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
user_data_dir = r'C:\Users\KAJAN BIRLA\.gemini\antigravity\scratch\chrome_temp'
artifact_dir = r'C:\Users\KAJAN BIRLA\.gemini\antigravity\brain\c52686d9-790d-4bde-b0a1-5a8518ebbeb5\screenshots'
project_dir = r'C:\Users\KAJAN BIRLA\.gemini\antigravity\scratch\invisible-habits\screenshots'

os.makedirs(user_data_dir, exist_ok=True)
os.makedirs(artifact_dir, exist_ok=True)
os.makedirs(project_dir, exist_ok=True)

print("Capturing desktop light/dark screenshots...")
for p in pages:
    for theme in ['light', 'dark']:
        filename = f"{p}_{theme}.png"
        out_artifact = os.path.join(artifact_dir, filename)
        out_project = os.path.join(project_dir, filename)
        url = f"http://localhost:5555/?page={p}&theme={theme}"

        cmd = [
            chrome_path,
            f"--user-data-dir={user_data_dir}",
            "--headless=new",
            "--disable-gpu",
            "--window-size=1440,960",
            "--virtual-time-budget=2000",
            f"--screenshot={out_artifact}",
            url
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, timeout=15)
            if os.path.exists(out_artifact):
                with open(out_artifact, 'rb') as src, open(out_project, 'wb') as dst:
                    dst.write(src.read())
                print(f"[OK] {filename} ({os.path.getsize(out_artifact)} bytes)")
            else:
                print(f"[WARN] Failed {filename}")
        except Exception as e:
            print(f"[ERR] {filename}: {e}")

# Mobile screenshots at 360px
mobile_pages = ['showcase', 'dietary-plan', 'summary', 'products']
print("Capturing mobile 360px screenshots...")
for p in mobile_pages:
    filename = f"{p}_mobile_360px.png"
    out_artifact = os.path.join(artifact_dir, filename)
    out_project = os.path.join(project_dir, filename)
    url = f"http://localhost:5555/?page={p}&theme=light"

    cmd = [
        chrome_path,
        f"--user-data-dir={user_data_dir}",
        "--headless=new",
        "--disable-gpu",
        "--window-size=360,780",
        "--virtual-time-budget=2000",
        f"--screenshot={out_artifact}",
        url
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, timeout=15)
        if os.path.exists(out_artifact):
            with open(out_artifact, 'rb') as src, open(out_project, 'wb') as dst:
                dst.write(src.read())
            print(f"[OK] {filename} ({os.path.getsize(out_artifact)} bytes)")
        else:
            print(f"[WARN] Failed {filename}")
    except Exception as e:
        print(f"[ERR] {filename}: {e}")
