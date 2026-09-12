"""
Where the pipeline keeps its working files.

Every script used to carry this path written out in full:

    /private/tmp/claude-501/.../ad843b4a-.../scratchpad/topper

There is a session id in the middle of that. The folder goes away when the
session ends, so running the same script the next day stopped on the first
missing file. The location is somewhere durable now, and TOPPER_WORK overrides
it if needed.

    from work import WORK
"""
import os
from pathlib import Path

WORK = Path(os.environ.get('TOPPER_WORK', str(Path.home() / 'Desktop' / 'topper-state')))
WORK.mkdir(parents=True, exist_ok=True)
