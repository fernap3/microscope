export interface PerfEntry
{
	Id: string;
	ParentId: string
	Type: "Enter" | "Exit";
	TimeStamp: string;
	CompanyId: string;
	UserId: string;
	SessionId: string;
	SessionNum: string;
	ThreadId: number;
	Depth: number;
	Name: string;
}

export interface PerfEntryEnter extends PerfEntry
{
	Type: "Enter";
}

export interface PerfEntryExit extends PerfEntry
{
	Type: "Exit";
	ClockTime: number;
	EStopwatch: number;
	ProcessorTime: number;
	Stopwatch: number;
	ThreadTime: number;
}

export interface PerfEntryTreeNode
{
	children: PerfEntryTreeNode[];
	entry: PerfEntry;
}