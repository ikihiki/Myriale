#!/usr/bin/env python3
import argparse, pathlib, subprocess, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
MODULES = [
    ('Myriale.StarEater.ConstellationDoorModule', 'constellation-door-1.0.0.myriale-module'),
    ('Myriale.StarEater.GuardianBattleModule', 'guardian-battle-1.0.0.myriale-module'),
]
OUTPUT_DIR = ROOT / 'backend/src/Myriale.Api/DemoModules'
parser = argparse.ArgumentParser()
parser.add_argument('--configuration', default='Debug')
parser.add_argument('--output-dir', type=pathlib.Path, default=OUTPUT_DIR)
args = parser.parse_args()
args.output_dir.mkdir(parents=True, exist_ok=True)
for project_name, package_name in MODULES:
    project = ROOT / 'backend/modules' / project_name / f'{project_name}.csproj'
    resources = project.parent / 'Resources'
    output = args.output_dir / package_name
    subprocess.run(['dotnet','build',str(project),'-c',args.configuration,'--nologo'], check=True)
    dll = project.parent / 'bin' / args.configuration / 'net10.0' / 'module.dll'
    entries = [(dll, 'module.dll'), (resources/'runtime.mjs','resources/runtime.mjs'), (resources/'module.css','resources/module.css')]
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source, name in entries:
            info = zipfile.ZipInfo(name, (1980,1,1,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, source.read_bytes())
    print(output)
