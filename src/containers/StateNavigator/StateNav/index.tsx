import { IData, IGraph, IGroup, INode } from '@antv/g6' // IGroup
import { createStatefulMachine } from '@avaragado/xstateful'
import { Button } from 'antd'
import * as React from 'react'

import { ButtonOptions, Title } from 'components/Panel'

import ErrorPage from 'components/ErrorPage'
import { exportToXState } from 'utils/export'
import { load } from 'utils/storage'
import { Machine } from 'xstate'

interface IEdge {
	id: string
	label: string
}

interface IProps {
	flow: IGraph
}

interface IState {
	error: string | null
	edges: IEdge[]
	state: any
	node: INode | IGroup | null
	allNodes: Array<INode | IGroup>
}

// external state machine
let xsf: any

export default class StateNavigator extends React.Component<IProps, IState> {
	state = { error: null, edges: [], state: null, allNodes: [], node: null }
	async componentDidMount() {
		const data: IData = await load()
		const xstate = exportToXState(data)
		const machine = Machine(xstate)
		xsf = createStatefulMachine({ machine })
		xsf.init()
		const { flow } = this.props
		const allNodes = [...flow.getNodes(), ...flow.getGroups()]
		this.validateNodes(allNodes)
		this.setState({ allNodes })
		this.next()
	}
	validateNodes = (allNodes: Array<INode | IGroup>) => {
		// validate no labels repeat
		const labels = {}
		for (const node of allNodes) {
			const label = node.model.label
			if (!label || !label.length) {
				this.setState({ error: `Node [${node.id}] requires a label` })
				return
			}
			if (labels[label]) {
				this.setState({
					error: `Duplicate node label "${label}" on [${labels[label]}] & [${
						node.id
					}]`,
				})
			}
			labels[label] = node.id
		}
	}
	next = () => {
		if (!this.state.error) {
			const currentNode = xsf.state.value
			const node: INode | IGroup | null =
				this.state.allNodes.find(
					({ model: { label } }: any) => label === currentNode,
				) || null
			if (!node) {
				this.setState({ error: 'Node not found' })
			} else {
				// clear previous selected
				this.props.flow.clearSelected()
				// set node as selected
				this.props.flow.setSelected(node, true)
				// get possible transitions as node edges
				const outEdges = node!.getOutEdges()
				const edges: IEdge[] = outEdges.map(({ model: { label, id } }) => ({
					label,
					id,
				}))
				// update state
				this.setState({ node, edges })
			}
		}
	}
	transition = (event: string) => {
		// consider using ids for transitioning
		// as names may not be unique
		xsf.transition(event)
		this.next()
	}
	reset = () => {
		xsf.init()
		this.next()
	}
	render() {
		if (this.state.error) {
			return <ErrorPage>{this.state.error}</ErrorPage>
		}
		return (
			<React.Fragment>
				<div>
					<Title>Transitions</Title>
					<ButtonOptions>
						{this.state.edges.map(({ id, label }: any) => (
							<Button
								style={{ margin: 5 }}
								key={id}
								onClick={() => this.transition(label)}>
								{label}
							</Button>
						))}
					</ButtonOptions>
				</div>

				<div>
					<Title>Actions</Title>
				</div>

				<div>
					<Title>Options</Title>
					<ButtonOptions>
						<Button type="primary" onClick={this.reset} style={{ margin: 5 }}>
							Reset
						</Button>
					</ButtonOptions>
				</div>
			</React.Fragment>
		)
	}
}
