#!/usr/bin/env python3
import argparse, pathlib, subprocess, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'backend/modules/Myriale.StarEater.ConstellationDoorModule/Myriale.StarEater.ConstellationDoorModule.csproj'
RESOURCES = PROJECT.parent / 'Resources'
OUTPUT = ROOT / 'backend/src/Myriale.Api/DemoModules/constellation-door-1.0.0.myriale-module'
parser = argparse.ArgumentParser()
parser.add_argument('--configuration', default='Debug')
parser.add_argument('--output', type=pathlib.Path, default=OUTPUT)
args = parser.parse_args()
subprocess.run(['dotnet','build',str(PROJECT),'-c',args.configuration,'--nologo'], check=True)
dll = PROJECT.parent / 'bin' / args.configuration / 'net10.0' / 'module.dll'
args.output.parent.mkdir(parents=True, exist_ok=True)
entries = [(dll, 'module.dll'), (RESOURCES/'runtime.mjs','resources/runtime.mjs'), (RESOURCES/'module.css','resources/module.css')]
with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for source, name in entries:
        info = zipfile.ZipInfo(name, (1980,1,1,0,0,0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, source.read_bytes())
print(args.output)
