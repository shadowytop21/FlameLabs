
<h2> DracoPanel is an open-source panel for managing your game servers, applications, and more built with modern technologies such as Node.js, Docker, and Express - made to work with our DracoDaemon software.</h2>

## Installation
### Picking a Server OS

DracoPanel runs on various operating systems, so pick whichever you are most comfortable using.

| Operating System | Version |     Supported      | Notes                                                       |
|------------------|---------|:------------------:|-------------------------------------------------------------|
| **Ubuntu**       | 24.04   | ✅ | Documentation written assuming Ubuntu 24.04 as the OS. |
|                  | 22.04   | ✅ |                                                             |
| **CentOS**       | 7       | ✅ | Extra repos are required.                                   |
|                  | 8       | ✅ | Note that CentOS 8 is EOL. Use Rocky or Alma Linux.         |
| **Debian**       | 11      | ✅ |                                                             |
|                  | 12      | ✅ |                                                             |
| **Windows**      | 11      | ⚠️ | May have issues due to Windows firewall.                   |
|                  | 10      | ⚠️ |                                                             |
| **macOS**        | 10.15+  | ⚠️ |                                                             |

## Dependencies

* Node.js `v20` and higher (Nodejs `v20` recommended).
* ### Installation Nodejs 20

```bash
curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
```


### Installation Panel

To install and start the Draco Panel , run the following commands:

```bash
git clone https://github.com/draco-labes/DracoPanel.git && cd DracoPanel && npm install && npm run seed && npm run createUser && node .
```

- Skyport (EOL)
- SRYDEN (https://sryden.com)
- HydraPanel,hydra-labes
- Edited by **hopingboyz**
