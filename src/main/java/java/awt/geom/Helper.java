package java.awt.geom;

import static jsweet.util.Lang.$insert;

import def.js.Array;
import jsweet.util.Lang;

public class Helper {

    public static final int ARRAY_PROCESS_BATCH_SIZE = 10000;

    public static Object[] unsafeClone(Object array, int fromIndex, int toIndex) {
	return Lang.array(((Array<?>) array).slice(fromIndex, toIndex));
    };

    public static void arraycopy(Object src, int srcOfs, Object dest, int destOfs, int len) {
	boolean overwrite = true;

	if (src == dest) {
	    // copying to the same array, make a copy first
	    src = unsafeClone(src, srcOfs, srcOfs + len);
	    srcOfs = 0;
	}
	for (int batchStart = srcOfs, end = srcOfs + len; batchStart < end;) {
	    // increment in block
	    int batchEnd = Math.min(batchStart + ARRAY_PROCESS_BATCH_SIZE, end);
	    len = batchEnd - batchStart;
	    applySplice(dest, destOfs, overwrite ? len : 0, unsafeClone(src, batchStart, batchEnd));
	    batchStart = batchEnd;
	    destOfs += len;
	}
    }

    private static void applySplice(Object arrayObject, int index, int deleteCount, Object arrayToAdd) {
	$insert("Array.prototype.splice.apply(arrayObject, [index, deleteCount].concat(arrayToAdd))");
    };

}
