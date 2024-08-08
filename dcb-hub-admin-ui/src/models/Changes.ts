interface UpdateChanges {
	new_values: { [key: string]: string };
	old_values: { [key: string]: string };
}

interface InsertChanges {
	[key: string]: string;
}

export type Changes = UpdateChanges | InsertChanges;
