<!-- @format -->

# G14Control Windows Desktop App

![Build/release](https://github.com/aredden/electron-G14Control/workflows/Build/release/badge.svg)

**ONLY WORKS ON G14 2020 (For the time being)**

**Example youtube video:**

[![](https://img.youtube.com/vi/4RbYqslijug/0.jpg)](http://www.youtube.com/watch?v=4RbYqslijug 'Click to play on Youtube.com')

## Features:

<ul>

### On start:

- Check if boost is visible, and allow you to modify the registry automatically using the app.
- Display current CPU temperature in menu area.

### **Status page:**

- Displays related computer info such as Model, BIOS version, memory, etc. (Be aware that the max clock speed is not accurate. All of the data is pulled directly from WMI, so they may be confusing).
- Displays most related drivers (ASUS / AMD / NVIDIA / Realtek / Dolby) and their versions.
- Displays most related (ASUS / AMD / NVIDIA / Realtek / Dolby) software.
- Displays the current G14ControlV2 configuration.

### **Plans page:**

- Allows you to create full plans which include CPU Tuning, Fan Curve, Armoury Crate profile, Windows power plans, Switchable Dynamic Graphics settings, and processor performance boost which you can enable with a single click.
- Plan builder with select dropdowns to choose between profiles for each category.

### **Fan Curve page:**

- Allows you to choose a manual fan curve using two graphs for CPU / GPU which you can save or apply.
- Allows you to choose an armoury crate throttle plan / fan curve, which will override the current official Armory Crate setting (until it gets overwritten by Armoury Crate, (unless it is disabled using the option on the _Settings_ page.))

### **CPU Tuning page:**

- Allows you to set cpu wattage / duration limits for SMU settings using ryzenadj under the hood. (This stuff is potentially dangerous and requires ring0 access to your computer.)

### **Windows Plan page:**

- Allows you to easily switch windows plan, and modify the boost value instantly (unfortunately both AC and DC values at this point in time). Although, if you switch boost for a currently active plan, you need to switch off the windows plan and back on for it to be properly applied, because #WindowsThings.

### **Discrete GPU:**

- Allows you to reset the discrete GPU by disabling it, and then re-enabling it one second after. This will kick all apps off, **Including currently running games**.
- Allows you to switch resolution and framerate, although it has been known to be buggy and I personally don't recommend using it.
- Allows you to switch your "Switchable Dynamic Graphics" preference. _This is per windows plan, and might require switching off and on the windows plan for it to take effect, similar to processor performance boost mode._

### **Battery page:**

- Allows you to set the battery charge limit, although unfortunately it will only last until the computer is turned off / put to sleep since the value gets reset (I am working on this).
- Shows current power delivery method and battery discharge rate.

### **Settings page:**

- Allows you to use a global shortcut macro, that you can choose, to open the app from minimized / or minimize it when focused.
- You can opt to disable Armoury Crate temporarily (until you reenable and restart your computer), and remap the rog key to perform the same action as the global shortcut macro.

### **Dropdown Menu**

- Option to open the location where logs are stored so you can send them to me if you experience issues! : )
- Option to have the app start on boot using task scheduler to avoid UAC.
- Option to import / export configuration so you don't lose your configurations between updates.
</ul>

If you like the app, and would like to support me, [donate](https://www.paypal.com/pools/c/8uiaar8Sl9) : ) <3

Be aware that **I have no idea what I'm doing**. All of this stuff works for me, but I am only a single developer and can't guarantee the safety of your machine if you choose to use this software, although, the beta has been used by many people in our server G14 Talk for several weeks and no one has had catastrophic results at this point (hopefully).

---

## Prerequisites for Development

Getting Node, Python, and Visual Studio setup:

- Install Nodejs 14 for Windows: https://nodejs.org/en/
- Verify installed correctly through command prompt `node -v` and `npm -v`
- Install Python from the Windows Store: https://www.microsoft.com/en-us/p/python-39/9p7qfqmjrfp7
- Run an elevated (as administrator) command prompt, and run: `npm install --global windows-build-tools`

File setup:

The `/electron` directory requires a `.env` file for paths to the included executables. Create this file and find and replace the `***` with the path to your \electron folder in this repo (e.g. `C:\dev\electron-G14Control\electron`)

```
ATRO_LOC=***\atrofac-cli\atrofac-cli.exe
RADJ_LOC=***\ryzenadj\ryzenadj.exe
CONFIG_LOC=***\src\config\config.dev.json
SCREEN_REF_LOC=***\screen-resolution\ChangeScreenResolution.exe
RESTART_GPU_LOC=***\restartgpu\RestartGPU.exe
```

## Dev Startup

> Requires at least node v14.8.0 (or at least that is what I am using during development)

There are two node packages, one in /electron, for the electron app, and one in the root directory, for the ReactJS UI.

In both, run `npm install` from your terminal of choice.

After installing, use two terminal windows, one in the root directory and one in /electron.

- In root terminal: `npm start`
- In /electron terminal: `npm run watch`

This should start a broken webpage, since it requires certain Electron functionality such as `window.IpcRenderer` for communication between the Electron backend and ReactJS frontend. The /electron terminal process will initialize as a functional Electron windowed application.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

### What Needs To Be Built...

This is just a starting list. I'm sure there is much more to do.

- Add settings page for more options such as "exit on window close" vs "run as icon app on window close", etc.
- Low level hardware monitoring \*_In progress_\*
- Bug fixing. \*_In progress_\*
  ...

## License

[MIT](https://github.com/aredden/electron-G14Control/blob/main/LICENSE)

## Support

If you wish to help me, or you have the beta you can check out the discord that I primarily use to give out the beta / chat about development.

Discord: https://discord.gg/482ST4M6Ag

**I'm currently not actively working, so donations are greatly appreciated!**

Donate: https://www.paypal.com/pools/c/8uiaar8Sl9

## Major Contributors

https://github.com/DaHyper/ (2021 g14 compatability)

https://github.com/thesacredmoocow/g14control-r2 (g14control's previous maintainer)

https://github.com/FlyGoat/RyzenAdj (adjusting tdp)

https://github.com/cronosun/atrofac (fan profiles)

- advanced cli configuration [documentation](https://github.com/cronosun/atrofac/blob/master/ADVANCED.md).

https://github.com/sbski (help with understanding ryzenadj & cpu performance limits control)

## References

https://github.com/zllovesuki/reverse_engineering/blob/master/G14 (hardware control via wmi)
