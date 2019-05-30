import { PerfEntry, PerfEntryTreeNode, PerfEntryEnter, PerfEntryExit } from "./perf-entry.js";
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

		// We only care about Exit nodes for this tree because they have the timing information
		//entries = entries.filter(e => e.Type === "Exit");

		const perfTree = this.buildTreeFromEntries(entries);

		console.log(`Parsed entries`, entries);
		console.log(`Created call tree`, perfTree);

		new TreeView(perfTree).render(document.querySelector(".section--callstack .section__content")! as HTMLElement);

		// Show summaries per entry name
		const totals: {[name: string]: number} = {};
		for (let entry of entries)
			totals[entry.Name] = (totals[entry.Name] || 0) + (entry as PerfEntryExit).Stopwatch;

		const summarySection = document.querySelector(".section--summary .section__content") as HTMLElement;
		for (let [name, time] of Object.entries(totals).slice().sort((a,b) => a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0))
		{
			const box = document.createElement("div");
			box.className = "summary__item";
			summarySection.appendChild(box);
			box.innerHTML = `${name}:<br>${new Intl.NumberFormat("en-US").format(time)}ms`;
		}

	}

	private buildTreeFromEntries(entries: PerfEntry[], level = 1): PerfEntryTreeNode[]
	{
		const tree = [] as PerfEntryTreeNode[];
		
		for (let entry of entries)
		{
			if (entry.Type === "Enter")
			{
				// We have found an Enter record.  Create a tree node.  We should encounter an Exit
				// record with timing information later.
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
						console.warn(`Skipping "Enter" record because it was either logged before its parent, or refers to a nonexistent parent: ${JSON.stringify(entry)}`);
					}
					else
					{
						node.children.push({ entry, children: [] });
					}
				}
			}
			else
			{
				// We have found an Exit record.  Look up the corresponding node in the tree
				// and add the timing information.
				const node = this.findNodeById(tree, entry.Id);
				if (!node)
				{
					console.warn(`Skipping "Exit" record because it was logged without a corresponding "Enter" record: ${JSON.stringify(entry)}`);
				}
				else
				{
					// Just straight copy the Exit node over the existing tree node.  Now that the tree is build,
					// nodes don't distinguish between entry and exit.
					Object.assign(node.entry, entry);
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

