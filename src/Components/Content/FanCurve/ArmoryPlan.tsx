/** @format */

import { Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import React, { Component } from 'react';

interface Props {
	selectPlan: (plan: ArmoryPlan) => void;
	currentPlan: ArmoryPlan;
}

interface State {
	plan: ArmoryPlan | undefined;
}

export default class ArmoryPlanSettings extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			plan: this.props.currentPlan,
		};
	}

	handleRadioClick = (value: RadioChangeEvent) => {
		let option = value.target.value;
		this.props.selectPlan(option);
	};

	render() {
		let { currentPlan } = this.props;
		return (
			<>
				<Radio.Group
					value={currentPlan}
					onChange={this.handleRadioClick}
					optionType={'default'}>
					<Radio value="windows" name="windows">
						Windows
					</Radio>
					<Radio value="silent" name="silent">
						Silent
					</Radio>
					<Radio value="performance" name="performance">
						Performance
					</Radio>
					<Radio value="turbo" name="turbo">
						Turbo
					</Radio>
				</Radio.Group>
			</>
		);
	}
}