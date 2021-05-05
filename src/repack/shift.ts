import { Bin }  from '../common'
import { move } from '../util/utils'

export function shiftOverfull(bins: Bin[]) {
  // Full here means neither overfull nor fully open. Hence, either exactly space utilized and/or
  // no open slots.
  const [overBins, openBins, fullBins] =  bins.reduce(
      (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
        if (bin.isOverfull()) {
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
    overBins.sort((a, b) => b.overfill - a.overfill)
    // Sort least to most freespace
    openBins.sort((a, b) => a.freeSpace - b.freeSpace)
    const mostOverutilizedBin = overBins[skippedBinCount]
    const itemToMove =
        mostOverutilizedBin.removeFromOverfill(openBins[openBins.length - 1].freeSpace)
    if (null === itemToMove) {
      ++skippedBinCount
    } else {
      // Will always find a target bin because itemToMove was restricted to being smaller than the
      // free space of the bin with the most free space.
      const insertionBinIndex = openBins.findIndex(bin => itemToMove.size <= bin.freeSpace)
      const insertionBin = openBins[insertionBinIndex]
      insertionBin.add(itemToMove)
      if (!insertionBin.isOpen()) {
        move(insertionBinIndex, openBins, fullBins)
      }
      if (mostOverutilizedBin.isOpen()) {
        move(skippedBinCount, overBins, openBins)
      } else if (!mostOverutilizedBin.isOverfull()) {
        move(skippedBinCount, overBins, fullBins)
      }
    }
  }
}
