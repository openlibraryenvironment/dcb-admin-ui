export function fileSizeConvertor(size: number)
{
  const valueInMb = (size / 1024 / 1024).toFixed(2);
  return valueInMb;
}