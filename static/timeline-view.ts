import { PerfEntryExit, PerfEntry } from "./perf-entry";

export class TimelineView
{
	constructor(private entries: PerfEntry[])
	{

	}

	public render(container: HTMLElement): void
	{
		container.innerHTML = "";
		
		const containerWidth = container.getBoundingClientRect().width;
		const topLevelEntries = this.entries.filter(e => e.ParentId == null);
		const earliestStart = new Date(this.entries.map(e => e.TimeStamp).reduce((acc, cur) => (!acc || (cur < acc)) ? cur : acc));
		const latestEnd = new Date(this.entries.map(e => e.TimeStamp).reduce((acc, cur) => (!acc || (cur > acc)) ? cur : acc));
		const msRange = latestEnd.getTime() - earliestStart.getTime();

		const spaceTaken: {startMs: number, endMs: number}[][] = [];

		for (let entry of topLevelEntries)
		{
			if (entry.Type === "Exit")
				continue;
			
			const left = (new Date(entry.TimeStamp).getTime() - earliestStart.getTime()) / msRange * containerWidth;
			const exitEntry = topLevelEntries.find(e => e.Id === entry.Id && e.Type === "Exit");

			if (!exitEntry)
			{
				console.warn(`Timeline skipping Enter record because no matching Exit record was found: ${entry}`);
				continue;
			}


			const startMs = new Date(entry.TimeStamp).getTime();
			const endMs = new Date(exitEntry.TimeStamp).getTime();
			const slot = this.findFreeSlot(startMs, endMs, spaceTaken);
			console.log(slot)

			const right = (endMs - earliestStart.getTime()) / msRange * containerWidth;
			const box = document.createElement("div");
			box.className = "timestamp__entry";
			box.style.left = left + "px";
			box.style.right = right + "px";
			box.style.top = slot*20 + "px";
			box.textContent = entry.Name;
			container.appendChild(box);

			if (!spaceTaken[slot])
				spaceTaken[slot] = [];

			spaceTaken[slot].push({ startMs, endMs });
		}
	}

	private findFreeSlot(startMs: number, endMs: number, spaceTaken: {startMs: number, endMs: number}[][]): number
	{
		for (let slot = 0; true; slot++)
		{
			const track = spaceTaken[slot];

			if (!track)
				return slot;

			let collision = false;
			for (let trackEntry of track)
			{
				if ((startMs >= trackEntry.startMs && startMs <= trackEntry.endMs)
				|| (endMs >= trackEntry.startMs && endMs <= trackEntry.endMs)
				|| (startMs <= trackEntry.startMs && endMs >= trackEntry.endMs))
				{
					collision = true;
					break;
				}
			}

			if (!collision)
				return slot;
		}
	}
}
