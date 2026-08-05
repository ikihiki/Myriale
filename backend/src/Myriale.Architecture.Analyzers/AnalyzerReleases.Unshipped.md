; Unshipped analyzer release

### New Rules

Rule ID | Category | Severity | Notes
--------|----------|----------|------
MYRSLICE001 | Architecture | Error | Cross-slice target types must be explicitly exported
MYRSLICE002 | Architecture | Error | Exports are limited to allowed feature layers
MYRSLICE003 | Architecture | Error | Exported signatures must be closed over exported types
MYRSLICE004 | Architecture | Error | Feature namespaces must identify a slice owner
MYRSLICE005 | Architecture | Error | Domain, Infrastructure, Http, and Entity types cannot cross slices
