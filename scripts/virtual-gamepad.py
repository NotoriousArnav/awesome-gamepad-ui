#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 The Awesome Gamepad UI Authors
"""Create a temporary virtual gamepad via /dev/uinput, and wiggle it.

Handy for developing and testing input handling without physical hardware:

    python3 scripts/virtual-gamepad.py               # 60s, "AWP Virtual Pad"
    python3 scripts/virtual-gamepad.py 30 "Pad Two"  # 30s, custom name

Start it, wait a few seconds for udev to tag the device as a joystick, then
start the app. It emits button presses and stick movements a few times a
second until it exits, then removes the device.

Requires write access to /dev/uinput — usually an ACL or the `input` group.
"""

import fcntl
import os
import struct
import sys
import time

UINPUT_MAX_NAME_SIZE = 80
ABS_CNT = 64
EV_SYN, EV_KEY, EV_ABS = 0, 1, 3
BUS_USB = 0x03

# struct uinput_user_dev field offsets (64-bit).
OFF_ID = UINPUT_MAX_NAME_SIZE
OFF_FF_MAX = OFF_ID + 8
OFF_ABSMAX = OFF_FF_MAX + 4
OFF_ABSMIN = OFF_ABSMAX + ABS_CNT * 4
OFF_ABSEND = OFF_ABSMIN + ABS_CNT * 4
SIZEOF_UINPUT_USER_DEV = OFF_ABSEND + ABS_CNT * 4 * 2

AXES = {  # code -> (min, max)
    0x00: (-32768, 32767),  # ABS_X
    0x01: (-32768, 32767),  # ABS_Y
    0x02: (-32768, 32767),  # ABS_Z
    0x03: (-32768, 32767),  # ABS_RX
    0x04: (-32768, 32767),  # ABS_RY
    0x05: (-32768, 32767),  # ABS_RZ
    0x10: (-1, 1),          # ABS_HAT0X
    0x11: (-1, 1),          # ABS_HAT0Y
}

BUTTONS = [  # BTN_GAMEPAD (0x130) first, so udev tags the device a joystick.
    0x130, 0x131, 0x133, 0x134,  # A B X Y
    0x136, 0x137,                # TL TR
    0x13A, 0x13B, 0x13C,         # SELECT START MODE
    0x13D, 0x13E,                # THUMBL THUMBR
]

EVENT_FMT = "qqHHi"  # struct input_event on 64-bit Linux

# Microsoft / Xbox ids, so the app's type detection has something to chew on.
VENDOR, PRODUCT, VERSION = 0x045E, 0x02FD, 0x0114


def _ioc(direction, type_char, nr, size):
    return (direction << 30) | (size << 16) | (ord(type_char) << 8) | nr


def _io(type_char, nr):
    return _ioc(0, type_char, nr, 0)


def _iow(type_char, nr, size):
    return _ioc(1, type_char, nr, size)


UI_DEV_CREATE = _io("U", 1)
UI_DEV_DESTROY = _io("U", 2)
UI_SET_EVBIT = _iow("U", 100, 4)
UI_SET_KEYBIT = _iow("U", 101, 4)
UI_SET_ABSBIT = _iow("U", 103, 4)


def emit(fd, etype, code, value):
    os.write(fd, struct.pack(EVENT_FMT, 0, 0, etype, code, value))


def sync(fd):
    emit(fd, EV_SYN, 0, 0)


def create(name):
    fd = os.open("/dev/uinput", os.O_WRONLY | os.O_NONBLOCK)

    fcntl.ioctl(fd, UI_SET_EVBIT, EV_KEY)
    fcntl.ioctl(fd, UI_SET_EVBIT, EV_ABS)
    fcntl.ioctl(fd, UI_SET_EVBIT, EV_SYN)
    for button in BUTTONS:
        fcntl.ioctl(fd, UI_SET_KEYBIT, button)
    for axis in AXES:
        fcntl.ioctl(fd, UI_SET_ABSBIT, axis)

    dev = bytearray(SIZEOF_UINPUT_USER_DEV)
    struct.pack_into(f"{UINPUT_MAX_NAME_SIZE}s", dev, 0, name.encode()[:79])
    struct.pack_into("HHHH", dev, OFF_ID, BUS_USB, VENDOR, PRODUCT, VERSION)
    struct.pack_into("I", dev, OFF_FF_MAX, 0)
    for axis, (minimum, maximum) in AXES.items():
        struct.pack_into("i", dev, OFF_ABSMAX + axis * 4, maximum)
        struct.pack_into("i", dev, OFF_ABSMIN + axis * 4, minimum)

    os.write(fd, bytes(dev))
    fcntl.ioctl(fd, UI_DEV_CREATE)
    return fd


def main():
    seconds = float(sys.argv[1]) if len(sys.argv) > 1 else 60.0
    name = sys.argv[2] if len(sys.argv) > 2 else "AWP Virtual Pad"

    fd = create(name)
    print(f"virtual gamepad {name!r} created; emitting for {seconds:.0f}s", flush=True)
    # Give udev a moment to tag the device before anything enumerates it.
    time.sleep(3)

    deadline = time.monotonic() + seconds
    try:
        while time.monotonic() < deadline:
            emit(fd, EV_ABS, 0x03, -22000)  # ABS_RX / RightStickX
            sync(fd)
            time.sleep(0.4)

            emit(fd, EV_KEY, 0x130, 1)  # BTN_A / South
            sync(fd)
            time.sleep(0.4)

            emit(fd, EV_KEY, 0x130, 0)
            emit(fd, EV_ABS, 0x03, 0)
            sync(fd)
            time.sleep(0.4)
    finally:
        fcntl.ioctl(fd, UI_DEV_DESTROY)
        os.close(fd)
        print("virtual gamepad removed", flush=True)


if __name__ == "__main__":
    main()
