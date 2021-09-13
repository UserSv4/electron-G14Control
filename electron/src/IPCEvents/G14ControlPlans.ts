/** @format */

import { BrowserWindow, IpcMain } from 'electron';
import { isNumber } from 'lodash';
import { updateNextPlan } from '../AutoPowerSwitching';
import { getConfig } from '../electron';
import getLogger from '../Logger';
import { modifyFanCurve } from './atrofac/ModifyFan';
import { modifyArmoryCratePlan } from './atrofac/SetArmoryPlan';
import { parseArrayCurve } from './AtrofacListeners';
import {
	getActivePlan,
	getWindowsPlans,
	setWindowsPlan,
	setGraphicsFromHelper,
	setBoostFromHelper,
} from './powercfg/Powercfg';
import { setRyzenadj } from './ryzenadj/ModifyCPU';

const LOGGER = getLogger('G14ControlPlans');

export const buildG14ControlPlanListeners = (win: BrowserWindow, ipc: IpcMain) => {
	ipc.handle('setG14ControlPlan', async (event, plano: G14ControlPlan | string) => {
		let config = getConfig();
		let plan: G14ControlPlan;
		if (typeof plano === 'string') {
			plan = config.plans.find((pln) => pln.name === plano);
		} else {
			plan = plano;
		}

		LOGGER.info(`Recieved plan:\n${JSON.stringify(plan, null, 2)}`);
		let curve: FanCurveConfig;
		if (plan.fanCurve) {
			curve = config.fanCurves.find((curv) => {
				return curv.name === plan.fanCurve;
			}) as FanCurveConfig;
		}
		let radj: RyzenadjConfigNamed;
		if (plan.ryzenadj) {
			radj = config.ryzenadj.options.find((rdj) => {
				return rdj.name === plan.ryzenadj;
			});
		}

		if ((curve || !plan.fanCurve) && (radj || !plan.ryzenadj)) {
			let full: FullG14ControlPlan = {
				name: plan.name,
				fanCurve: curve,
				ryzenadj: radj,
				armouryCrate: plan.armouryCrate,
				boost: plan.boost,
				windowsPlan: plan.windowsPlan,
				graphics: plan.graphics,
			};
			let result = await setG14ControlPlan(full);
			if (result) {
				return true;
			} else {
				LOGGER.error('Failed to set G14Control plan.');
				return false;
			}
		} else {
			LOGGER.info(
				`Could not find curve or ryzenadj plan with names:\nryzen: ${plan.ryzenadj}\ncurve: ${plan.fanCurve}`
			);
			return false;
		}
	});
};

export const switchWindowsPlanToActivateSettings: (activeguid: string) => Promise<boolean> = async (
	activeGuid
) => {
	let allWindowsPlans = await getWindowsPlans();
	if (allWindowsPlans) {
		let otherPlan = allWindowsPlans.find((plan) => {
			return plan.guid !== activeGuid;
		});
		if (otherPlan) {
			LOGGER.info(`Found other plan: ${otherPlan.name}`);
			let other = await setWindowsPlan(otherPlan.guid);
			if (other) {
				return new Promise((resolve) => {
					setTimeout(async () => {
						LOGGER.info(`Switched to other plan: ${otherPlan.name}`);
						let back = await setWindowsPlan(activeGuid);
						if (back) {
							LOGGER.info(`Successfully switched to: ${activeGuid}`);
							resolve(true);
						} else {
							LOGGER.error(
								`There was an issue switching back from off plan to previous active plan.\nprevious: ${activeGuid}\noff: ${otherPlan.guid}`
							);
							resolve(false);
						}
					}, 500);
				});
			} else {
				LOGGER.error(
					`There was an issue setting the active plan to off plan:\ncurrent: ${activeGuid}\noff: ${otherPlan.guid} `
				);
				return false;
			}
		} else {
			LOGGER.error('Could not find plan with matching GUID: ' + activeGuid);
			return false;
		}
	} else {
		LOGGER.error("Couldn't get all windows plans.");
		return false;
	}
};

export const setRyzenadjWithDelay = async (
	ryzenadj: RyzenadjConfig | RyzenadjConfigNamed | undefined
) => {
	if (ryzenadj) {
		let { fastLimit, slowLimit, stapmLimit } = ryzenadj;
		ryzenadj = Object.assign(ryzenadj, {
			fastLimit: fastLimit % 1000 === 0 ? fastLimit : fastLimit * 1000,
			slowLimit: slowLimit % 1000 === 0 ? slowLimit : slowLimit * 1000,
			stapmLimit: stapmLimit % 1000 === 0 ? stapmLimit : stapmLimit * 1000,
		});
	}
	let ryzn = ryzenadj ? await setRyzenadj(ryzenadj) : true;
	if (!ryzn) {
		let final = await keepAttemptRyzenADJ(ryzenadj, 6);
		if (!final) {
			return false;
		}
	}
	return true;
};

/**
 * 1. Set Boost & Graphics at target windows plan since they are sensitive to changes.
 * 2. Switch to target windows plan
 * 3. Switch to target windows plan 
2. Set  because they need to change and are sensitive
3. Switch to new plan if different, or switch off and on if same
4. Set ryzenadj
5. Set fan curve
@param FullG14ControlPlan
@returns Boolean
*/
export const setG14ControlPlan = async (plan: FullG14ControlPlan) => {
	let { ryzenadj, fanCurve, boost, armouryCrate, graphics, windowsPlan } = plan;
	let boos: boolean;
	let graphi: boolean;
	if (boost || (isNumber(boost) && boost === 0)) {
		boos = (await setBoostFromHelper(boost, windowsPlan.guid, false)) as boolean;
	}

	if (graphics || graphics === 0) {
		graphi = (await setGraphicsFromHelper(graphics, windowsPlan.guid, false)) as boolean;
		if (graphi) {
			LOGGER.info('Successfully set graphics values to: ' + graphics);
		} else {
			LOGGER.info('There was an issue setting graphics to: ' + graphics);
		}
	}

	let b_g = boostOrGraphicsSet(boos, graphi, boost, graphics);

	if (b_g) {
		return new Promise((resolve) => {
			setTimeout(async () => {
				let active = await getActivePlan();
				if (active && active.guid === windowsPlan.guid) {
					let switched = await switchWindowsPlanToActivateSettings(windowsPlan.guid);
					if (!switched) {
						LOGGER.error(
							"Couldn't activate G14Control plan because couldn't shuffle windows plan to activate boost / graphics settings"
						);
						resolve(false);
						return;
					}
				}
				let result = await new Promise(async (resolve) => {
					setTimeout(async () => {
						let arm = armouryCrate
							? await modifyArmoryCratePlan(armouryCrate.toLowerCase() as ArmoryPlan)
							: 'noarmoury';
						if (arm || arm === 'noarmoury') {
							LOGGER.info('Successfully modified armory crate plan to: ' + armouryCrate);
							let switchPlan = true;
							if (active && active.guid !== windowsPlan.guid) {
								switchPlan = await setWindowsPlan(windowsPlan.guid);
							}
							if (switchPlan) {
								LOGGER.info('Successfully switched windows plan to target plan.');
								if (fanCurve) {
									let { cpu, gpu, plan: plan_s } = fanCurve;
									let gpuCurve = gpu ? parseArrayCurve(gpu) : undefined;
									let cpuCurve = cpu ? parseArrayCurve(cpu) : undefined;
									let armPlan = arm === 'noarmoury' ? plan_s : armouryCrate;
									if (cpu || gpu || armPlan) {
										let result = await modifyFanCurve(
											cpuCurve,
											gpuCurve,
											armPlan ? armPlan.toLowerCase() : undefined
										);
										if (result) {
											LOGGER.info('Sucessfully applied fancurve');
											setTimeout(async () => {
												let ryadjResult = await setRyzenadjWithDelay(ryzenadj);
												if (ryadjResult) {
													LOGGER.info('Sucessfully applied G14ControlPlan "' + plan.name + '"');
													updateNextPlan(plan);
												} else {
													LOGGER.info('Failed to apply ryzenadj plan & therefore G14ControlPlan');
												}
												resolve(ryadjResult);
											}, 1000);
										} else {
											LOGGER.error('Failed to modify fan curve.');
											resolve(false);
										}
									}
								} else {
									setTimeout(async () => {
										let ryadjResult = await setRyzenadjWithDelay(ryzenadj);
										if (ryadjResult) {
											LOGGER.info('Sucessfully applied G14ControlPlan "' + plan.name + '"');
											updateNextPlan(plan);
										} else {
											LOGGER.info('Failed to apply ryzenadj plan & therefore G14ControlPlan');
										}
										resolve(ryadjResult);
									}, 1000);
								}
							} else {
								LOGGER.error('Failed to switch windows plan to target plan.');
								resolve(false);
							}
						} else {
							LOGGER.error('Failed to set Armoury Crate plan.');
							resolve(false);
						}
					}, 1000);
				});
				resolve(result);
			}, 1000);
		});
	} else {
		LOGGER.error("Couldn't set boost & graphics preferences.");
		return false;
	}
};

export const keepAttemptRyzenADJ = async (plan: RyzenadjConfig, tries: number) => {
	if (tries <= 0) {
		return false;
	} else {
		let attempt = await setRyzenadj(plan);
		if (!attempt) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(keepAttemptRyzenADJ(plan, tries - 1));
				}, 500);
			});
		} else {
			return true;
		}
	}
};

export const boostOrGraphicsSet = (
	boos: boolean,
	graphi: boolean,
	boost?: number,
	graphics?: number
) => {
	let resultGraphics = true;
	let resultBoost = true;
	if (graphics || (isNumber(graphics) && graphics === 0)) {
		resultGraphics = graphi;
	}
	if (boost || (isNumber(boost) && boost === 0)) {
		resultBoost = boos;
	}
	return resultGraphics && resultBoost;
};
