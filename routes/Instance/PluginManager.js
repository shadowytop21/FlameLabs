const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../../handlers/db.js');
const { isUserAuthorizedForContainer } = require('../../utils/authHelper');
const { fetchFiles } = require('../../utils/fileHelper');

const { loadPlugins } = require('../../plugins/loadPls.js');
const path = require('path');

const plugins = loadPlugins(path.join(__dirname, '../../plugins'));

const BASE_URL = 'http://plugins.multicraft.org/api/v1/spigot';
const DEFAULT_LOGO_URL = 'https://static.spigotmc.org/styles/spigot/xenresource/resource_icon.png';

async function getPluginList() {
  try {
    const response = await axios.get(`${BASE_URL}/plugins`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plugin list:', error);
    return [];
  }
}

async function getPluginDetails(id) {
  try {
    const response = await axios.get(`${BASE_URL}/plugin?id=${id}`);
    const plugin = response.data;

    return {
      id: plugin.id,
      name: plugin.name,
      link: plugin.link,
      description: plugin.description,
      logo: plugin.logo || DEFAULT_LOGO_URL, 
    };
  } catch (error) {
    console.error('Error fetching plugin details:', error);
    return null;
  }
}

async function getPluginVersions(id) {
  try {
    const response = await axios.get(`${BASE_URL}/plugin_versions?id=${id}`);
    const pluginVersions = response.data;

    return {
      game_versions: pluginVersions.game_versions || [],
      download: pluginVersions.download || null,
      size: pluginVersions.size || null,
    };
  } catch (error) {
    console.error('Error fetching plugin versions:', error);
    return null;
  }
}

router.get('/api/plugins', async (req, res) => {
    const plugins = await getPluginList();
    res.json(plugins);
  });

router.get('/api/plugin/info/:id', async (req, res) => {
    const pluginId = req.params.id;
    const pluginDetails = await getPluginDetails(pluginId);
  
    if (pluginDetails) {
      res.json(pluginDetails);
    } else {
      res.status(404).json({ message: 'Plugin not found' });
    }
  });
  
  router.get('/api/plugin/versions/:id', async (req, res) => {
    const pluginId = req.params.id;
    const pluginVersions = await getPluginVersions(pluginId);
  
    if (pluginVersions) {
      res.json(pluginVersions);
    } else {
      res.status(404).json({ message: 'Plugin versions not found' });
    }
  });
  router.get("/instance/:id/plugins", async (req, res) => {
    if (!req.user) return res.redirect('/');

    const { id } = req.params;
    if (!id) return res.redirect('/');

    let instance = await db.get(id + '_instance');
    if (!instance) return res.redirect('../instances');

    const java = 'quay.io/skyport/java:21'

    if (!instance.Image === java) {
        return res.redirect('../../instance/' + id);
    }
    const isAuthorized = await isUserAuthorizedForContainer(req.user.userId, instance.Id);
    if (!isAuthorized) {
        return res.status(403).send('Unauthorized access to this instance.');
    }

    if(!instance.suspended) {
        instance.suspended = false;
        db.set(id + '_instance', instance);
    }

    if(instance.suspended === true) {
        return res.redirect('../../instance/' + id + '/suspended');
    }

    const config = require('../../config.json');
    const { port, domain } = config;

    const allPluginData = Object.values(plugins).map(plugin => plugin.config);

    res.render('instance/plugin_manager', {
        req,
        ContainerId: instance.ContainerId,
        instance,
        port,
        domain,
        user: req.user,
        name: await db.get('name') || 'HydraPanel',
        logo: await db.get('logo') || false,
        files: await fetchFiles(instance, ""),
        addons: {
            plugins: allPluginData
        }
    });
});
router.get("/instance/:id/plugins/download/:pluginId", async (req, res) => {
    if (!req.user) return res.redirect('/');

    const { id, pluginId } = req.params;
    if (!id) return res.redirect('/');

    let instance = await db.get(id + '_instance');
    if (!instance) return res.redirect('../instances');

    const java = 'quay.io/skyport/java:21'

    if (!instance.Image === java) {
        return res.redirect('../../instance/' + id);
    }
    const isAuthorized = await isUserAuthorizedForContainer(req.user.userId, instance.Id);
    if (!isAuthorized) {
        return res.status(403).send('Unauthorized access to this instance.');
    }

    if(!instance.suspended) {
        instance.suspended = false;
        db.set(id + '_instance', instance);
    }

    if(instance.suspended === true) {
        return res.redirect('../../instance/' + id + '/suspended');
    }
   
    const pluginDownload = getPluginVersions(pluginId);

    const pluginDownloadurl = `${pluginDownload.download}`
    const requestData = {
        method: 'get',
        url: `http://${instance.Node.address}:${instance.Node.port}/fs/${instance.VolumeId}/files/plugin/${pluginDownloadurl}`,
        auth: {
            username: 'Skyport',
            password: instance.Node.apiKey
        },
        headers: { 
            'Content-Type': 'application/json'
        }
    };
    axios.get(requestData)
    res.status(404).json({ success : true })
});
module.exports = router;