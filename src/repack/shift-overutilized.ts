import { Bin }  from '../common'
import { move } from '../util/utils'

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
  let skippedBinCount = 0
  while (overBins.length > skippedBinCount) {
    if (openBins.length < 1) {
      // The remaining overutilized bins will need to swap out items.
      return
    }
    // TODO: Keep bins sorted more efficiently.
    // Sort most to least overutilized
    overBins.sort((a, b) => b.overutilization - a.overutilization)
    // Sort least to most freespace
    openBins.sort((a, b) => a.freeSpace - b.freeSpace)
    const mostOverutilizedBin = overBins[skippedBinCount]
    const itemToMove =
        mostOverutilizedBin.removeFromOverutilization(openBins[openBins.length - 1].freeSpace)
    if (null == itemToMove) {
      ++skippedBinCount
    } else {
      const insertionBinIndex = openBins.findIndex(bin => itemToMove.size <= bin.freeSpace)
      const insertionBin = openBins[insertionBinIndex]
      insertionBin.add(itemToMove)
      if (!insertionBin.isOpen()) {
        move(insertionBinIndex, openBins, fullBins)
      }
      if (mostOverutilizedBin.isOpen()) {
        move(skippedBinCount, overBins, openBins)
      } else if (!mostOverutilizedBin.isOverutilized()) {
        move(skippedBinCount, overBins, fullBins)
      }
    }
  }
}
