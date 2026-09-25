import zipfile, os, shutil

BASE_DIR = r"C:\Users\KIIT\BreachKeep"
ZIPS_DIR = os.path.join(BASE_DIR, "ZIPs")
THEMES_DIR = os.path.join(BASE_DIR, "apps", "web", "src", "shell", "styles", "themes")
PUBLIC_DIR = os.path.join(BASE_DIR, "apps", "web", "public")

os.makedirs(THEMES_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

# 1. Copy the 4 zip files to themes directory
for house in ['arcweave', 'emberkeep', 'rimeguard', 'voltgrid']:
    src_zip = os.path.join(ZIPS_DIR, f"{house}.zip")
    dst_zip = os.path.join(THEMES_DIR, f"{house}.zip")
    print(f"Copying {src_zip} -> {dst_zip}")
    shutil.copy2(src_zip, dst_zip)

# 2. Extract public assets to apps/web/public
for house in ['arcweave', 'emberkeep', 'rimeguard', 'voltgrid']:
    zpath = os.path.join(ZIPS_DIR, f"{house}.zip")
    with zipfile.ZipFile(zpath) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            if '/public/' in info.filename or info.filename.startswith('web/public/'):
                fname = os.path.basename(info.filename)
                target = os.path.join(PUBLIC_DIR, fname)
                with open(target, 'wb') as f:
                    f.write(z.read(info.filename))
                print(f"Public asset: {fname} ({info.file_size} bytes)")

# 3. Extract components and CSS for each theme into themes/<house>/
for house in ['arcweave', 'emberkeep', 'rimeguard', 'voltgrid']:
    house_dir = os.path.join(THEMES_DIR, house)
    os.makedirs(house_dir, exist_ok=True)
    zpath = os.path.join(ZIPS_DIR, f"{house}.zip")
    with zipfile.ZipFile(zpath) as z:
        for info in z.infolist():
            if info.is_dir() or 'node_modules' in info.filename:
                continue
            fname = os.path.basename(info.filename)
            # We want components and index.css
            if ('src/components/' in info.filename or fname == 'index.css' or fname == 'App.css') and not info.filename.startswith('arcweave/web/dist/'):
                # For arcweave, don't copy rimeguard leftover files
                if house == 'arcweave' and fname.startswith('Rimeguard'):
                    continue
                target = os.path.join(house_dir, fname)
                with open(target, 'wb') as f:
                    f.write(z.read(info.filename))
                print(f"Extracted {house}/{fname}")

print("\nDone extracting and copying!")
