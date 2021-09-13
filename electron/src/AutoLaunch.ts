/** @format */

import { app } from 'electron';
import getLogger from './Logger';
import Shell from 'node-powershell';
import path from 'path';
import fs from 'fs';

const LOGGER = getLogger('AutoLaunch');

const startupCommand = (enabled: boolean) =>
	enabled
		? `$Action = New-ScheduledTaskAction -Execute "${process.execPath}" -Argument hide
	$Trigger = New-ScheduledTaskTrigger -AtLogOn
	$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
	Register-ScheduledTask G14ControlSkipUAC -Action $Action -Trigger $Trigger -Settings $Settings -RunLevel Highest`
		: `Unregister-ScheduledTask -TaskName G14ControlSkipUAC  -Confirm:$false`;

const removeOldStartupFile = async () => {
	const userPath = app.getPath('appData');
	let filePath = path.join(
		userPath,
		'Microsoft\\Windows\\Start Menu\\Programs\\Startup\\G14ControlV2.bat'
	);
	fs.unlink(filePath, function (err) {
		if (err) {
			LOGGER.info('Old Startup file not found');
		} else {
			LOGGER.info('Old startup file deleted.');
		}
	});
};

export const setAutoLaunch = async (enabled: boolean) => {
	const ps = new Shell({
		noProfile: true,
		executionPolicy: 'bypass',
		inputEncoding: 'utf-8',
		outputEncoding: 'utf-8',
	});
	return new Promise(async (resolve) => {
		await removeOldStartupFile();
		let taskAlreadyExists = await checkTaskExists('G14ControlSkipUAC');
		if (taskAlreadyExists) {
			ps.addCommand(startupCommand(false));
			try {
				await ps.invoke();
				if (!enabled) {
					ps.dispose();
					resolve(true);
					return;
				}
			} catch (err) {
				LOGGER.info('Error removing old startup task:\n' + err);
				if (!enabled) {
					ps.dispose();
					resolve(true);
					return;
				}
			}
		}
		ps.addCommand(startupCommand(enabled));
		ps.invoke()
			.then((response: string) => {
				ps.dispose();
				if ((enabled && response.includes('Ready')) || (!enabled && response.length === 0)) {
					LOGGER.info('Startup modification completed.');
					resolve(true);
				} else {
					LOGGER.error(`Error creating startup Task : ${response}`);
					resolve(false);
				}
			})
			.catch((error) => {
				LOGGER.error(
					`There was an error thrown when trying to set autolaunch ${enabled}..\nError: ${error}`
				);
				ps.dispose();
				resolve(false);
			});
	});
};

export const checkTaskExists = async (name: string) => {
	let ps = new Shell({
		noProfile: true,
		executionPolicy: 'Bypass',
		inputEncoding: 'utf-8',
		outputEncoding: 'utf-8',
	});
	let command = `Get-ScheduledTask | Where-Object {$_.TaskName -like "${name}*" }`;
	ps.addCommand(command);
	return new Promise<boolean>((resolve) => {
		ps.invoke()
			.then((result) => {
				ps.dispose();
				if (result.length > 0) {
					LOGGER.info(
						`Results were returned from task exists query, meaning task was not in list.`
					);
					resolve(true);
				} else {
					LOGGER.info(`Search for task ${name}* didn't come up with any results.`);
					resolve(false);
				}
			})
			.catch((err) => {
				LOGGER.error(`An error was thrown while checking if task: ${name} existed`);
				ps.dispose();
				resolve(false);
			});
	});
};
