import * as React from 'react'

import './editor.css'
import './modelFlowEditor.css'
import initFlow from './RegisterFlow'
import { items } from './RegisterFlow/PanelItems'

import { load } from '../../utils/storage'
import ContextMenu from '../ContextMenu'
import Navigator from '../Navigator'
import Page from '../Page'
import Toolbar from '../Toolbar'
import DetailsCanvas from './Details/Canvas'
import DetailsState from './Details/State'
import DetailsTransition from './Details/Transition'
import initEditor from './Editor'
import initPage from './Page'
import Zoom from './Zoom'

interface IState {
	selectedModel: any
	tempModel: any | null
}

class Editor extends React.Component<{}, IState> {
	page: any
	editor: any
	state = {
		selectedModel: {},
		tempModel: null,
	}
	componentDidMount() {
		const page = initPage(this.onChange)
		const editor = initEditor(page)
		this.page = page
		this.editor = editor
		initFlow()
		// load saved data
		this.load()
	}

	componentWillUnmount() {
		this.editor.destroy()
	}

	load = async () => {
		const loaded = await load()
		console.log('loaded', loaded)
		this.page.read(loaded)
	}

	toggleGrid = (ev: any) => {
		if (ev.target.checked) {
			this.page.showGrid()
		} else {
			this.page.hideGrid()
		}
	}
	updateGraph = (key: string, value: any) => {
		this.editor.executeCommand(() => {
			const selectedItems = this.page.getSelected()
			selectedItems.forEach((item: any) => {
				const updateModel = {}
				updateModel[key] = value
				this.page.update(item, updateModel)
			})
		})
	}

	onChange = (change: any) => {
		this.setState(change)
	}
	render() {
		const { tempModel, selectedModel } = this.state
		const model = tempModel !== null ? tempModel : selectedModel
		return (
			<div id="editor">
				<Toolbar page={this.page} />
				<div style={{ height: '42px' }} />
				<div className="bottom-container">
					<ContextMenu />
					<div id="itempannel">
						<ul>
							{items.map((item: any) => (
								<li
									key={item.key}
									className="getItem"
									data-shape={item.key}
									data-type="node"
									data-size={item.size}>
									<span className={item.class} />
									{item.label}
								</li>
							))}
						</ul>
					</div>
					<div id="detailpannel">
						<div
							data-status="node-selected"
							className="pannel"
							id="node_detailpannel">
							<div className="pannel-title">State</div>
							<div className="block-container">
								<DetailsState
									model={model}
									onChange={this.onChange}
									updateGraph={this.updateGraph}
								/>
							</div>
						</div>
						<div
							data-status="edge-selected"
							className="pannel"
							id="edge_detailpannel">
							<div className="pannel-title">Transition</div>
							<div className="block-container">
								<DetailsTransition
									model={model}
									onChange={this.onChange}
									updateGraph={this.updateGraph}
								/>
							</div>
						</div>
						<div
							data-status="group-selected"
							className="pannel"
							id="node_detailpannel">
							<div className="pannel-title">Group</div>
							<div className="block-container">
								<DetailsState
									model={model}
									onChange={this.onChange}
									updateGraph={this.updateGraph}
								/>
							</div>
						</div>
						<div
							data-status="canvas-selected"
							className="pannel"
							id="canvas_detailpannel">
							<div className="pannel-title">Canvas</div>
							<div className="block-container">
								<DetailsCanvas toggleGrid={this.toggleGrid} />
							</div>
						</div>
					</div>
					<Zoom>
						{({ zoom, minZoom, maxZoom }) => (
							<Navigator
								zoom={zoom}
								minZoom={minZoom}
								maxZoom={maxZoom}
								changeZoom={(change) => this.page.zoom(change)}
							/>
						)}
					</Zoom>
					<Page />
				</div>
			</div>
		)
	}
}

export default Editor
