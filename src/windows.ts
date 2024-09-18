import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
const voidPtr = ref.refType(ref.types.void);
const stringPtr = ref.refType(ref.types.CString);
const user32 = ffi.Library('user32.dll', {
    GetSystemMenu: ['int', ['int', 'bool']],
    EnumWindows: ['bool', [voidPtr, 'int32']],
    GetWindowTextA: ['long', ['long', stringPtr, 'long']],
    SetForegroundWindow: ['bool', ['long']],
    MapVirtualKeyA: ['long', ['long', 'long']],
    PostMessageW: ['bool', ['long', 'long', 'long', ref.types.ulong]],
    SendMessageA: ['bool', ['long', 'long', 'long', ref.types.ulong]],
    keybd_event:['bool', ['int', 'int', 'int', 'int']]
});

function RunCopy() {
    user32.keybd_event(0x11, 0, 0, 0);
    user32.keybd_event(0x43, 0, 0, 0);
    user32.keybd_event(0x43, 0, 2, 0);
    user32.keybd_event(0x11, 0, 2, 0);
}
export { RunCopy };