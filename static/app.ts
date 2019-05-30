import { PerfEntry, PerfEntryTreeNode } from "./perf-entry.js";
import { TreeView } from "./entry-tree.js";
import * as idb from "./idb-keyval.js";

export class App
{
	private fileDropCoverShown = false;
	
	constructor()
	{
		const profileInput = document.getElementById("profile-upload-input") as HTMLInputElement;
		profileInput.onchange = evt =>
		{
			if (!profileInput.files)
				return;

			const reader = new FileReader();
			reader.onload = () => {
				idb.set("perfsession", reader.result as string);
				this.renderProfile(reader.result as string);
			};

			reader.readAsText(profileInput.files[0]);
		};

		document.body.addEventListener("dragover", evt =>
		{
			evt.stopPropagation();
			evt.preventDefault();

			if (this.fileDropCoverShown)
				return;
			
			evt.dataTransfer!.dropEffect = "copy";
			this.showDropCover();
			this.fileDropCoverShown = true;
		});

		document.body.addEventListener("dragleave", evt =>
		{
			evt.stopPropagation();
			evt.preventDefault();

			if (!this.fileDropCoverShown)
				return;
			
			this.hideDropCover();
			this.fileDropCoverShown = false;
		});

		document.body.addEventListener("drop", evt =>
		{
			evt.stopPropagation();
			evt.preventDefault();
			
			const files = evt.dataTransfer!.files;
			if (files.length === 0)
				return;

			const reader = new FileReader();
			reader.onload = () =>
			{
				idb.set("perfsession", reader.result as string);
				this.renderProfile(reader.result as string);
			};
			reader.readAsText(files[0]);
			this.hideDropCover();
		});

		idb.get("perfsession").then(session =>
		{
			if (session)
				this.renderProfile(session as any);
		});
	}

	private showDropCover(): void
	{
		const cover = document.createElement("div");
		cover.id = "file-drop-cover";
		cover.className = "file-drop-cover";
		document.body.appendChild(cover);
	}

	private hideDropCover(): void
	{
		const cover = document.getElementById("file-drop-cover")!;
		cover.remove();	
	}

	private renderProfile(profileText: string): void
	{
		let entries = this.loadEntriesFromJson(profileText);

		if(new Set(entries.map(e => e.SessionId)).size > 1)
		{
			console.log("Only one session ID is supported currently; picking the entries from the last session ID in the logs");
			entries = entries.filter(e => e.SessionId === entries[entries.length - 1].SessionId);
		}

		if(new Set(entries.map(e => e.SessionNum)).size > 1)
		{
			console.log("Only one session num is supported currently; picking the entries from the last session num in the logs");
			entries = entries.filter(e => e.SessionNum === entries[entries.length - 1].SessionNum);
		}

		const perfTree = this.buildTreeFromEntries(entries);

		console.log(`Parsed entries`, entries);
		console.log(`Created call tree`, perfTree);

		new TreeView(perfTree).render(document.querySelector(".section--callstack .section__content")! as HTMLElement);
	}

	private buildTreeFromEntries(entries: PerfEntry[], level = 1): PerfEntryTreeNode[]
	{
		const tree = [] as PerfEntryTreeNode[];
		const topLevelNodes = entries.filter(e => e.Depth === level);
		
		for (let entry of entries)
		{
			if (!entry.ParentId)
			{
				tree.push({ entry, children: [] });
			}
			else
			{
				const node = this.findNodeById(tree, entry.ParentId);

				if (!node)
				{
					// Currently, this algorithm relies on parent entries always showing up in the log before
					// their children.
					console.log(`Skipping ${JSON.stringify(entry)} because it was either logged before its parent, or refers to a nonexistent parent.`);
				}
				else
				{
					node.children.push({ entry, children: [] });
				}
			}
		}

		return tree;
	}

	private findNodeById(tree: PerfEntryTreeNode[], searchId: string): PerfEntryTreeNode | null
	{
		for (let node of tree)
		{
			if (node.entry.Id === searchId)
				return node;
			else
			{
				const subResult = this.findNodeById(node.children, searchId);
				if (subResult)
					return subResult;
			}
		}

		return null;
	}

	private loadEntriesFromJson(profileText: string): PerfEntry[]
	{
		return profileText.split(/\r?\n/)
			.map(l => {
				const match = l.match(/^\d\d\d\d-\d\d-\d\d.+\] - ({.+})$/);
				return match && match[1] ? match[1] : null;
			})
			.filter(l => l != null)
			.map(e => JSON.parse(e!));
	}

	private loadEntriesFromLegacy(profileText: string): PerfEntry[]
	{
		throw "Not yet implemented";
	}
}

new App();

