import { load } from 'cheerio';
import fetch from 'node-fetch-native';
import cli from 'prompts';
import unzip from 'unzipper';

import fs from 'fs/promises';
import fsc from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { fileURLToPath } from 'url';

// Godot download repository
const baseURL = "https://downloads.tuxfamily.org/godotengine/";
const verRegex = /^[0-9]+(\.[0-9]+){0,3}$/;

// __dirname isn't officially supported in modules, but we need it, so this is the compromise
const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

// Default export function
const downloadModule = async () => {
    // Get list of Godot versions - this includes unsupported versions currently.
    // TODO: Change that
    const listVersions = async () => {
        // Get list of versions
        const response = await fetch(baseURL);
        const parsedResponse = await response.text();
        let $ = load(parsedResponse);
        const listing = $('tbody td.n a').toArray();

        const versions = [];
        for(const version of listing) {
            const versionNum = version.children[0].data;

            // Make sure we're getting ONLY Godot Engine downloads... no toolchains and whatnot!
            if(!(verRegex.test(versionNum))) continue;

            versions.push({
                title: versionNum,
                value: baseURL + version.attribs.href
            });
        }

        return versions;
    }

    // This name is a little misleading... it's moreso "list all ZIP and APK files"
    const listPlatforms = async (url) => {
        // Get list of files
        const response = await fetch(url);
        const parsedResponse = await response.text();
        let $ = load(parsedResponse);
        const listing = $('tbody td.n a').toArray();

        const platforms = [];

        for(const platform of listing) {
            const platformTitle = platform.children[0].data;

            // We only want APK (Android), ZIP (Everything Else), and TPZ (Export Templates)
            // Export templates will be excluded in the prompt
            if(!platformTitle.endsWith('.apk') && !platformTitle.endsWith('.zip') && !platformTitle.endsWith('.tpz')) continue;
            if(platformTitle.startsWith('Parent') || platformTitle.startsWith('rc') || platformTitle.startsWith('alpha') || platformTitle.startsWith('beta')) continue;

            platforms.push({
                title: platformTitle,
                value: url + platform.attribs.href
            });
        }

        return platforms;
    }

    const versions = await listVersions();

    // Clear console for cleaner viewing
    console.clear();

    // User selects Godot version, save it to chosenVersion.url
    const chosenVersion = await cli({
        type: 'select',
        name: 'url',
        message: 'Select a Godot version.',
        choices: versions,
        initial: 1
    });

    const platforms = await listPlatforms(chosenVersion.url);

    // If there's only alpha/beta/rc then it's unsupported for now... so sad.
    if(!platforms[0]) throw new Error("No Supported Downloads Found");

    // User selects file they want to download
    const chosenPackage = await cli({
        type: 'select',
        name: 'url',
        message: 'Select a platform.',
        choices: platforms.filter(p => !p.value.endsWith('.tpz')),
        initial: 1,
        hint: '- Remember: alphas, betas, and release candidates are not supported yet!' // Wondering where the beta builds are? NOWHERE!
    });

    // Format the strings for use in the Big Function Made For Downloading Files (BFMDF)
    const packageURL = chosenPackage.url;
    const packageTitle = chosenPackage.url.split('/').slice(-1)[0];

    // Big Function Made For Downloading Files (BFMDF)
    const downloadPackage = async () => {
        // Get specifically the version that was chosen, not the URL. We need this for the folder name.
        const godotVersion = chosenVersion.url.split('/').slice(-2)[0];

        // Try to make the "godot" folder - if it already exists, skip it.
        try {
            await fs.mkdir('./godot/' + godotVersion + '/');
        } catch(err) {
            console.log(`./godot/${godotVersion} exists, skipping mkdir...`);
        }

        const godotFolder = './godot/' + godotVersion;
        const response = await fetch(packageURL); // Get details about the file
        const totalSize = response.headers.get('content-length'); // Get size of the file

        // Create Readable stream
        const data = Readable.fromWeb(response.body);

        const godotFolderPath = path.join(__dirname, godotFolder);

        // Big Function Made For After The User Is Done Downloading The Main Files (BFMATUISSTMF)
        const postDownload = async () => {
            // Ask the user if they even want to download the export templates (default: Yes)
            const shouldDownloadTemplates = await cli({
                type: 'confirm',
                name: 'response',
                initial: true,
                message: "Would you also like to download the export templates for this version? (This WILL take a while!)"
            });

            // Download the export templates.
            // What? It's not that big of a function
            if(shouldDownloadTemplates.response) {
                // Create templates.tpz for the version
                await fs.writeFile(`${godotFolderPath}/templates.tpz`, '');
                const templateStream = fsc.createWriteStream(`${godotFolderPath}/templates.tpz`);

                const templateURL = platforms.filter(p => p.value.includes('export_templates'))[0];

                const tResponse = await fetch(templateURL.value);
                const tTotalSize = tResponse.headers.get('content-length'); // Get size of templates (big)

                const templateData = Readable.fromWeb(tResponse.body);

                var downloadedBytes = 0; // Track how much we've downloaded thus far

                // Log all the chunks of data we download
                templateData.on('data', (chunk) => {
                    const chunkSize = Buffer.byteLength(chunk);
                    downloadedBytes += chunkSize;

                    const percentage = Math.floor((downloadedBytes / tTotalSize) * 100);

                    console.clear(); // Cleaner viewing

                    let downloadedMB = Math.ceil(downloadedBytes / 1000) / 1000; // Since export templates are so big, we'll do them in mb rather than kb
                    const totalMB = Math.ceil(tTotalSize / 1000) / 1000
                    console.log(`${percentage}% downloaded... (${downloadedMB.toFixed(2)}mb/${totalMB.toFixed(2)}mb)`); // Show user that progress is being made
                });

                // Wait for the download to finish
                await finished(templateData.pipe(templateStream));

                console.log('Finished! Thank you for waiting... for Godot.');
            } else {
                console.clear();
                console.log('No templates today? That\'s alright! Thank you for waiting... for Godot.');
            }
        }
        
        await fs.writeFile(`${godotFolderPath}/${packageTitle}`, ''); // Create ZIP file at location
        
        const fileStream = fsc.createWriteStream(`${godotFolderPath}/${packageTitle}`); // Writable stream for the ZIP

        var downloadedBytes = 0; // Track how much we've downloaded thus far

        data.on('data', (chunk) => {
            // Log all the chunks of data we download
            const chunkSize = Buffer.byteLength(chunk);
            downloadedBytes += chunkSize;

            const percentage = Math.floor((downloadedBytes / totalSize) * 100);

            console.clear();
            // Show user that progress is being made
            console.log(`${percentage}% downloaded... (${Math.ceil(downloadedBytes / 1000)}kb/${Math.ceil(totalSize / 1000)}kb)`);
        })

        // Wait for the download to finish
        await finished(data.pipe(fileStream));

        // If it's an APK file, it doesn't need to be extraced. Just proceed to asking if they want export templates
        if(packageTitle.endsWith('.apk')) return postDownload();

        console.clear();
        console.log('Download finished, unzipping file... (depending on your hardware, this may take a bit.)');

        // Create readable stream for the ZIP file, we need this to extract it
        const readStream = fsc.createReadStream(`${godotFolderPath}/${packageTitle}`);

        var extendedPath = '';

        // If it's the web editor, we'll put it in its own directory, cause of how many files there are
        if(packageTitle.endsWith('web_editor.zip')) extendedPath = 'web/';

        // Extract the file to the base folder
        readStream.pipe(unzip.Extract({ path: `${godotFolderPath}/${extendedPath}` }));

        console.log('Cleaning stuff up...');

        // Delete the ZIP file - the user doesn't need it anymore
        await fs.unlink(`${godotFolderPath}/${packageTitle}`);

        console.clear();

        // Post download stuff
        await postDownload();
    }

    downloadPackage();
}

export default downloadModule;