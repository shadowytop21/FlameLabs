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
async function getPluginVersions(id, minecraftVersion) {
  try {
    const response = await axios.get(`${BASE_URL}/plugin_versions?id=${id}`);
    const pluginVersions = response.data;

    // Filter versions based on the specified Minecraft version
    const filteredVersions = pluginVersions.filter(
      (version) => version.game_versions.includes(minecraftVersion)
    );

    if (filteredVersions.length === 0) {
      throw new Error(`No compatible versions found for Minecraft version ${minecraftVersion}`);
    }

    // Return the first valid version (you can modify logic if needed)
    const selectedVersion = filteredVersions[0];

    return {
      game_versions: selectedVersion.game_versions || [],
      download: selectedVersion.download || null,
      size: selectedVersion.size || null,
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

router.get("/instance/:id/plugins/download/:pluginId/:minecraft_version", async (req, res) => {
  if (!req.user) return res.redirect('/');

  const { id, pluginId, minecraft_version } = req.params;
  if (!id || !minecraft_version) return res.redirect('/');

  let instance = await db.get(id + '_instance');
  if (!instance) return res.redirect('../instances');

  const java = 'quay.io/skyport/java:21';

  if (instance.Image !== java) {
    return res.redirect(`../../instance/${id}`);
  }

  const isAuthorized = await isUserAuthorizedForContainer(req.user.userId, instance.Id);
  if (!isAuthorized) {
    return res.status(403).send('Unauthorized access to this instance.');
  }

  if (!instance.suspended) {
    instance.suspended = false;
    db.set(id + '_instance', instance);
  }

  if (instance.suspended === true) {
    return res.redirect(`../../instance/${id}/suspended`);
  }

  try {
    // Fetch plugin versions and filter by Minecraft version
    const pluginData = await getPluginVersions(pluginId, minecraft_version);
    if (!pluginData || !pluginData.download) {
      return res.status(404).json({ success: false, message: "Plugin not found or incompatible version." });
    }

    // Check if the Minecraft version is compatible
    const compatibleVersions = pluginData.game_versions || [];
    if (!compatibleVersions.includes(minecraft_version)) {
      return res.status(400).json({ success: false, message: `Minecraft version ${minecraft_version} is not supported.` });
    }

    const pluginDownloadUrl = encodeURIComponent(pluginData.download); // Encode URL for safety

    // Prepare the request to upload the plugin
    const requestData = {
      method: 'post',
      url: `http://${instance.Node.address}:${instance.Node.port}/fs/${instance.VolumeId}/files/plugin/${pluginDownloadUrl}`,
      auth: {
        username: 'Skyport',
        password: instance.Node.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      data: {}, // Empty body for POST request
    };

    // Send the request to download and store the plugin
    const downloadResponse = await axios(requestData);

    // Check the response and return appropriate status
    if (downloadResponse.status === 200) {
      return res.redirect(`/instance/${id}/plugins?success=true`);
    } else {
      return res.status(500).json({ success: false, message: "Error downloading plugin." });
    }
  } catch (error) {
    console.error('Error during plugin download:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "An error occurred while processing your request." });
  }
});


module.exports = router;