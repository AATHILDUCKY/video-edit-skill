#!/usr/bin/env python3
"""Install video-edit and all bundled companion skills using standard-library Python."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent/'scripts'))
from install_bundle import main
if __name__=='__main__':
    raise SystemExit(main())
