export function binToInt(data: boolean[], signed: boolean=false): number {
    let num = 0;
    if (signed)
    {
        if (data[0])
        {
            num -= 2 ** data.length;
        }
    }

    for (let i = signed ? 1 : 0; i < data.length; i++)
    {
        if (data[i])
        {
            num += 2 ** (data.length - i - 1);
        }
    }

    return num;
}