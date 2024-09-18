// clang-format off
#include <windows.h>
#include <commctrl.h>
// clang-format on
#pragma comment(lib, "Comctl32.lib")
void copy(){
    // Simulate Ctrl+C to copy highlighted text
    keybd_event(VK_CONTROL, 0, 0, 0);
    keybd_event('C', 0, 0, 0);
    keybd_event('C', 0, KEYEVENTF_KEYUP, 0);
    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);

    // Give Windows time to process the simulated key presses
    Sleep(100);


}
int main(){
    copy();
    return 0;
}