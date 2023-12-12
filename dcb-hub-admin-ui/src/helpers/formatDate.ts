import dayjs from 'dayjs';


export function formatDate(inputDateStr: string): string {
	const isBST = inputDateStr.includes('BST');
	const cleanedDateStr = isBST ? inputDateStr.replace(' BST', ''): inputDateStr.replace(' GMT', '');
	const myDate = dayjs(cleanedDateStr, 'ddd DD MMM HH:mm:ss z YYYY');
	const formattedDate = myDate.format('YYYY-MM-DD');
	return formattedDate;
}