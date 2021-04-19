import { Bin }  from '../common'

export function shiftOverutilized(bins: Bin[]) {
  const [overBins, openBins, fullBins] =  bins.reduce(
      (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
        if (bin.isOverutilized()) {
          acc[0].push(bin)
        } else if (bin.isOpen()) {
          acc[1].push(bin)
        } else {
          acc[2].push(bin)}
        return acc
      },
      [[], [], []]
  )
  while (overBins.length > 0) {
    if (openBins.length < 1) {
      throw new Error(`There are still ${overBins.length} overutilized bins but no more open bins`)
    }
    // TODO: Keep bins sorted more efficiently.
    // Sort most to least overutilized
    overBins.sort((a, b) => b.overutilization - a.overutilization)
    // Sort least to most freespace
    openBins.sort((a, b) => a.freeSpace - b.freeSpace)
    const mostOverutilizedBin = overBins[0]
    const itemToMove =
        mostOverutilizedBin.removeFromOverutilization(openBins[openBins.length - 1].freeSpace)
    // Will find an insertion bin since removeFromremoveFromOverutilization throws if it can't
    // return an item that will fit in the bin with the most open space.
    const insertionBinIndex = openBins.findIndex(bin => itemToMove.size <= bin.freeSpace)
    const insertionBin = openBins[insertionBinIndex]
    insertionBin.add(itemToMove)
    if (insertionBin.isFull()) {
      move(insertionBinIndex, openBins, fullBins)
    }
    if (mostOverutilizedBin.isOpen()) {
      move(0, overBins, openBins)
    } else if (mostOverutilizedBin.isFull()) {
      move(0, overBins, fullBins)
    }
  }
}

function move<T>(index: number, from: T[], to: T[]) {
  to.push(from.splice(index, 1)[0])
}
