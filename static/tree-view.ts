import { PerfEntryTreeNode, PerfEntryExit } from "./perf-entry";

export class TreeView
{
	private tree: TreeViewNode[];
	
	constructor(tree: PerfEntryTreeNode[])
	{
		this.tree = tree as any;
		
		// Default all tree nodes to "closed"
		this.forEachTreeNode(node => node.open = false);
	}

	public render(container: HTMLElement): void
	{
		container.innerHTML = "";
		
		for (let node of this.tree)
			this.renderSubtree(node, container);

		container.onclick = evt => this.onTreeClick(evt);
	}

	private renderSubtree(root: TreeViewNode, container: HTMLElement): void
	{
		const nodeBox = document.createElement("div");
		nodeBox.className = `treeview__node${root.children.length?" treeview__node--folder":""}${root.children.length&&root.open?" treeview__node--open":""}`;
		nodeBox.setAttribute("data-id", root.entry.Id);

		const timeinfo = `${new Intl.NumberFormat("en-US").format(root.entry.Stopwatch)}ms`;

		nodeBox.innerHTML = `
			<div class="treeview__nodetitle">
				${root.entry.Name}
				<span class="treeview__nodetitle__timeinfo">${timeinfo}</span>
			</div>
		`;

		container.appendChild(nodeBox);

		if (root.open)
			this.renderChildren(root, nodeBox);
	}

	private renderChildren(root: TreeViewNode, rootContainer: HTMLElement): void
	{
		for (let node of root.children)
		{
			this.renderSubtree(node, rootContainer);
		}
	}

	private forEachTreeNode(callback: (node: TreeViewNode) => boolean, subtreeRoot: TreeViewNode | null = null): void
	{
		const children = subtreeRoot ? subtreeRoot.children : this.tree;

		if (subtreeRoot)
		{
			if (!callback(subtreeRoot))
				return;
		}
		
		for (let node of children)
		{
			if (!callback(node))
				return;

			this.forEachTreeNode(callback, node);
		}
	}

	private onTreeClick(evt: MouseEvent): void
	{
		if (!(evt.target instanceof HTMLElement))
			return;

		const nodeTitle = evt.target.closest(".treeview__nodetitle");
		if (!nodeTitle)
			return;

		// The user clicked on a tree node title.  Expand or collapse the node
		const node = evt.target.closest(".treeview__node") as HTMLElement;
		const nodeId = node.getAttribute("data-id")!;

		const dataNode = this.getNodeById(nodeId);
		if (dataNode.open)
		{
			// The node is open; close it
			node.classList.remove("treeview__node--folder--open");
			for (let child of [...node.querySelectorAll(".treeview__node")])
				child.remove();
		}
		else
		{
			// The node is closed; open it
			node.classList.add("treeview__node--folder--open");
			this.renderChildren(dataNode, node);
		}

		dataNode.open = !dataNode.open;
	}

	private getNodeById(id: string): TreeViewNode
	{
		let returnNode: TreeViewNode | null = null;
		this.forEachTreeNode(node => {
			if (node.entry.Id === id)
			{
				returnNode = node;
				return false;
			}
			return true;
		});

		if (!returnNode)
			throw `Node with id "${id}" not found`;

		return returnNode;
	}
}

interface TreeViewNode extends PerfEntryTreeNode
{
	open: boolean;
	children: TreeViewNode[];
	entry: PerfEntryExit;
}