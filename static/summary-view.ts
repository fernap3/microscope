import { PerfEntryExit, PerfEntry } from "./perf-entry";

export class SummaryView
{
	private entries: PerfEntry[];
	constructor(entries: PerfEntry[])
	{
		// The summary view only cares about "Exit" records because that's where the timing info is
		this.entries = entries.filter(e => e.Type === "Exit");
	}

	public render(container: HTMLElement): void
	{
		container.innerHTML = "";
		
		// Show summaries per entry name
		const totals: {[name: string]: number} = {};
		for (let entry of this.entries)
			totals[entry.Name] = (totals[entry.Name] || 0) + (entry as PerfEntryExit).Stopwatch;


		const summarySection = document.querySelector(".section--summary .section__content") as HTMLElement;
		const entriesSorted = Object.entries(totals).slice().sort((a,b) => a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0);

		const lowestTime = entriesSorted[entriesSorted.length - 1][1];
		const highestTime = entriesSorted[0][1];
		const range = highestTime - lowestTime;
		const hotLowerBound = (range*.8) + lowestTime;
		const warmLowerBound = (range*.6) + lowestTime;

		for (let [name, time] of entriesSorted)
		{
			const box = document.createElement("div");
			box.className = "summary__item";
			summarySection.appendChild(box);
			box.innerHTML = `${name}:<br><span${time >= hotLowerBound ? " class='summary__item--hot'": time >= warmLowerBound ? " class='summary__item--warm'": ""}>${new Intl.NumberFormat("en-US").format(time)}ms</span>`;
		}
	}
}
