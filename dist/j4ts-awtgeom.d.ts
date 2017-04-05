/**
 * The <code>AffineTransform</code> class represents a 2D affine transform
 * that performs a linear mapping from 2D coordinates to other 2D
 * coordinates that preserves the "straightness" and
 * "parallelness" of lines.  Affine transformations can be constructed
 * using sequences of translations, scales, flips, rotations, and shears.
 * <p>
 * Such a coordinate transformation can be represented by a 3 row by
 * 3 column matrix with an implied last row of [ 0 0 1 ].  This matrix
 * transforms source coordinates {@code (x,y)} into
 * destination coordinates {@code (x',y')} by considering
 * them to be a column vector and multiplying the coordinate vector
 * by the matrix according to the following process:
 * <pre>
 * [ x']   [  m00  m01  m02  ] [ x ]   [ m00x + m01y + m02 ]
 * [ y'] = [  m10  m11  m12  ] [ y ] = [ m10x + m11y + m12 ]
 * [ 1 ]   [   0    0    1   ] [ 1 ]   [         1         ]
 * </pre>
 * <h3><a name="quadrantapproximation">Handling 90-Degree Rotations</a></h3>
 * <p>
 * In some variations of the <code>rotate</code> methods in the
 * <code>AffineTransform</code> class, a double-precision argument
 * specifies the angle of rotation in radians.
 * These methods have special handling for rotations of approximately
 * 90 degrees (including multiples such as 180, 270, and 360 degrees),
 * so that the common case of quadrant rotation is handled more
 * efficiently.
 * This special handling can cause angles very close to multiples of
 * 90 degrees to be treated as if they were exact multiples of
 * 90 degrees.
 * For small multiples of 90 degrees the range of angles treated
 * as a quadrant rotation is approximately 0.00000121 degrees wide.
 * This section explains why such special care is needed and how
 * it is implemented.
 * <p>
 * Since 90 degrees is represented as <code>PI/2</code> in radians,
 * and since PI is a transcendental (and therefore irrational) number,
 * it is not possible to exactly represent a multiple of 90 degrees as
 * an exact double precision value measured in radians.
 * As a result it is theoretically impossible to describe quadrant
 * rotations (90, 180, 270 or 360 degrees) using these values.
 * Double precision floating point values can get very close to
 * non-zero multiples of <code>PI/2</code> but never close enough
 * for the sine or cosine to be exactly 0.0, 1.0 or -1.0.
 * The implementations of <code>Math.sin()</code> and
 * <code>Math.cos()</code> correspondingly never return 0.0
 * for any case other than <code>Math.sin(0.0)</code>.
 * These same implementations do, however, return exactly 1.0 and
 * -1.0 for some range of numbers around each multiple of 90
 * degrees since the correct answer is so close to 1.0 or -1.0 that
 * the double precision significand cannot represent the difference
 * as accurately as it can for numbers that are near 0.0.
 * <p>
 * The net result of these issues is that if the
 * <code>Math.sin()</code> and <code>Math.cos()</code> methods
 * are used to directly generate the values for the matrix modifications
 * during these radian-based rotation operations then the resulting
 * transform is never strictly classifiable as a quadrant rotation
 * even for a simple case like <code>rotate(Math.PI/2.0)</code>,
 * due to minor variations in the matrix caused by the non-0.0 values
 * obtained for the sine and cosine.
 * If these transforms are not classified as quadrant rotations then
 * subsequent code which attempts to optimize further operations based
 * upon the type of the transform will be relegated to its most general
 * implementation.
 * <p>
 * Because quadrant rotations are fairly common,
 * this class should handle these cases reasonably quickly, both in
 * applying the rotations to the transform and in applying the resulting
 * transform to the coordinates.
 * To facilitate this optimal handling, the methods which take an angle
 * of rotation measured in radians attempt to detect angles that are
 * intended to be quadrant rotations and treat them as such.
 * These methods therefore treat an angle <em>theta</em> as a quadrant
 * rotation if either <code>Math.sin(<em>theta</em>)</code> or
 * <code>Math.cos(<em>theta</em>)</code> returns exactly 1.0 or -1.0.
 * As a rule of thumb, this property holds true for a range of
 * approximately 0.0000000211 radians (or 0.00000121 degrees) around
 * small multiples of <code>Math.PI/2.0</code>.
 *
 * @author Jim Graham
 * @since 1.2
 */
declare class AffineTransform {
    static TYPE_UNKNOWN: number;
    /**
     * This constant indicates that the transform defined by this object
     * is an identity transform.
     * An identity transform is one in which the output coordinates are
     * always the same as the input coordinates.
     * If this transform is anything other than the identity transform,
     * the type will either be the constant GENERAL_TRANSFORM or a
     * combination of the appropriate flag bits for the various coordinate
     * conversions that this transform performs.
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_IDENTITY: number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a translation in addition to the conversions indicated
     * by other flag bits.
     * A translation moves the coordinates by a constant amount in x
     * and y without changing the length or angle of vectors.
     * @see #TYPE_IDENTITY
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_TRANSLATION: number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a uniform scale in addition to the conversions indicated
     * by other flag bits.
     * A uniform scale multiplies the length of vectors by the same amount
     * in both the x and y directions without changing the angle between
     * vectors.
     * This flag bit is mutually exclusive with the TYPE_GENERAL_SCALE flag.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_UNIFORM_SCALE: number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a general scale in addition to the conversions indicated
     * by other flag bits.
     * A general scale multiplies the length of vectors by different
     * amounts in the x and y directions without changing the angle
     * between perpendicular vectors.
     * This flag bit is mutually exclusive with the TYPE_UNIFORM_SCALE flag.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_GENERAL_SCALE: number;
    /**
     * This constant is a bit mask for any of the scale flag bits.
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @since 1.2
     */
    static TYPE_MASK_SCALE: number;
    static TYPE_MASK_SCALE_$LI$(): number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a mirror image flip about some axis which changes the
     * normally right handed coordinate system into a left handed
     * system in addition to the conversions indicated by other flag bits.
     * A right handed coordinate system is one where the positive X
     * axis rotates counterclockwise to overlay the positive Y axis
     * similar to the direction that the fingers on your right hand
     * curl when you stare end on at your thumb.
     * A left handed coordinate system is one where the positive X
     * axis rotates clockwise to overlay the positive Y axis similar
     * to the direction that the fingers on your left hand curl.
     * There is no mathematical way to determine the angle of the
     * original flipping or mirroring transformation since all angles
     * of flip are identical given an appropriate adjusting rotation.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_FLIP: number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a quadrant rotation by some multiple of 90 degrees in
     * addition to the conversions indicated by other flag bits.
     * A rotation changes the angles of vectors by the same amount
     * regardless of the original direction of the vector and without
     * changing the length of the vector.
     * This flag bit is mutually exclusive with the TYPE_GENERAL_ROTATION flag.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_QUADRANT_ROTATION: number;
    /**
     * This flag bit indicates that the transform defined by this object
     * performs a rotation by an arbitrary angle in addition to the
     * conversions indicated by other flag bits.
     * A rotation changes the angles of vectors by the same amount
     * regardless of the original direction of the vector and without
     * changing the length of the vector.
     * This flag bit is mutually exclusive with the
     * TYPE_QUADRANT_ROTATION flag.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #getType
     * @since 1.2
     */
    static TYPE_GENERAL_ROTATION: number;
    /**
     * This constant is a bit mask for any of the rotation flag bits.
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @since 1.2
     */
    static TYPE_MASK_ROTATION: number;
    static TYPE_MASK_ROTATION_$LI$(): number;
    /**
     * This constant indicates that the transform defined by this object
     * performs an arbitrary conversion of the input coordinates.
     * If this transform can be classified by any of the above constants,
     * the type will either be the constant TYPE_IDENTITY or a
     * combination of the appropriate flag bits for the various coordinate
     * conversions that this transform performs.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #getType
     * @since 1.2
     */
    static TYPE_GENERAL_TRANSFORM: number;
    /**
     * This constant is used for the internal state variable to indicate
     * that no calculations need to be performed and that the source
     * coordinates only need to be copied to their destinations to
     * complete the transformation equation of this transform.
     * @see #APPLY_TRANSLATE
     * @see #APPLY_SCALE
     * @see #APPLY_SHEAR
     * @see #state
     */
    static APPLY_IDENTITY: number;
    /**
     * This constant is used for the internal state variable to indicate
     * that the translation components of the matrix (m02 and m12) need
     * to be added to complete the transformation equation of this transform.
     * @see #APPLY_IDENTITY
     * @see #APPLY_SCALE
     * @see #APPLY_SHEAR
     * @see #state
     */
    static APPLY_TRANSLATE: number;
    /**
     * This constant is used for the internal state variable to indicate
     * that the scaling components of the matrix (m00 and m11) need
     * to be factored in to complete the transformation equation of
     * this transform.  If the APPLY_SHEAR bit is also set then it
     * indicates that the scaling components are not both 0.0.  If the
     * APPLY_SHEAR bit is not also set then it indicates that the
     * scaling components are not both 1.0.  If neither the APPLY_SHEAR
     * nor the APPLY_SCALE bits are set then the scaling components
     * are both 1.0, which means that the x and y components contribute
     * to the transformed coordinate, but they are not multiplied by
     * any scaling factor.
     * @see #APPLY_IDENTITY
     * @see #APPLY_TRANSLATE
     * @see #APPLY_SHEAR
     * @see #state
     */
    static APPLY_SCALE: number;
    /**
     * This constant is used for the internal state variable to indicate
     * that the shearing components of the matrix (m01 and m10) need
     * to be factored in to complete the transformation equation of this
     * transform.  The presence of this bit in the state variable changes
     * the interpretation of the APPLY_SCALE bit as indicated in its
     * documentation.
     * @see #APPLY_IDENTITY
     * @see #APPLY_TRANSLATE
     * @see #APPLY_SCALE
     * @see #state
     */
    static APPLY_SHEAR: number;
    static HI_SHIFT: number;
    static HI_IDENTITY: number;
    static HI_IDENTITY_$LI$(): number;
    static HI_TRANSLATE: number;
    static HI_TRANSLATE_$LI$(): number;
    static HI_SCALE: number;
    static HI_SCALE_$LI$(): number;
    static HI_SHEAR: number;
    static HI_SHEAR_$LI$(): number;
    /**
     * The X coordinate scaling element of the 3x3
     * affine transformation matrix.
     *
     * @serial
     */
    m00: number;
    /**
     * The Y coordinate shearing element of the 3x3
     * affine transformation matrix.
     *
     * @serial
     */
    m10: number;
    /**
     * The X coordinate shearing element of the 3x3
     * affine transformation matrix.
     *
     * @serial
     */
    m01: number;
    /**
     * The Y coordinate scaling element of the 3x3
     * affine transformation matrix.
     *
     * @serial
     */
    m11: number;
    /**
     * The X coordinate of the translation element of the
     * 3x3 affine transformation matrix.
     *
     * @serial
     */
    m02: number;
    /**
     * The Y coordinate of the translation element of the
     * 3x3 affine transformation matrix.
     *
     * @serial
     */
    m12: number;
    /**
     * This field keeps track of which components of the matrix need to
     * be applied when performing a transformation.
     * @see #APPLY_IDENTITY
     * @see #APPLY_TRANSLATE
     * @see #APPLY_SCALE
     * @see #APPLY_SHEAR
     */
    state: number;
    /**
     * This field caches the current transformation type of the matrix.
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_FLIP
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @see #TYPE_UNKNOWN
     * @see #getType
     */
    type: number;
    constructor(m00?: any, m10?: any, m01?: any, m11?: any, m02?: any, m12?: any, state?: any);
    /**
     * Returns a transform representing a translation transformation.
     * The matrix representing the returned transform is:
     * <pre>
     * [   1    0    tx  ]
     * [   0    1    ty  ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} tx the distance by which coordinates are translated in the
     * X axis direction
     * @param {number} ty the distance by which coordinates are translated in the
     * Y axis direction
     * @return {AffineTransform} an <code>AffineTransform</code> object that represents a
     * translation transformation, created with the specified vector.
     * @since 1.2
     */
    static getTranslateInstance(tx: number, ty: number): AffineTransform;
    /**
     * Returns a transform representing a rotation transformation.
     * The matrix representing the returned transform is:
     * <pre>
     * [   cos(theta)    -sin(theta)    0   ]
     * [   sin(theta)     cos(theta)    0   ]
     * [       0              0         1   ]
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     * @param {number} theta the angle of rotation measured in radians
     * @return {AffineTransform} an <code>AffineTransform</code> object that is a rotation
     * transformation, created with the specified angle of rotation.
     * @since 1.2
     */
    static getRotateInstance$double(theta: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates around an anchor point.
     * This operation is equivalent to translating the coordinates so
     * that the anchor point is at the origin (S1), then rotating them
     * about the new origin (S2), and finally translating so that the
     * intermediate origin is restored to the coordinates of the original
     * anchor point (S3).
     * <p>
     * This operation is equivalent to the following sequence of calls:
     * <pre>
     * AffineTransform Tx = new AffineTransform();
     * Tx.translate(anchorx, anchory);    // S3: final translation
     * Tx.rotate(theta);                  // S2: rotate around anchor
     * Tx.translate(-anchorx, -anchory);  // S1: translate anchor to origin
     * </pre>
     * The matrix representing the returned transform is:
     * <pre>
     * [   cos(theta)    -sin(theta)    x-x*cos+y*sin  ]
     * [   sin(theta)     cos(theta)    y-x*sin-y*cos  ]
     * [       0              0               1        ]
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     *
     * @param {number} theta the angle of rotation measured in radians
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates around the specified point by the specified angle of
     * rotation.
     * @since 1.2
     */
    static getRotateInstance$double$double$double(theta: number, anchorx: number, anchory: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates according to
     * a rotation vector.
     * All coordinates rotate about the origin by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * an identity transform is returned.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(Math.atan2(vecy, vecx));
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates according to the specified rotation vector.
     * @since 1.6
     */
    static getRotateInstance$double$double(vecx: number, vecy: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates around an anchor
     * point according to a rotation vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * an identity transform is returned.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(Math.atan2(vecy, vecx),
     * anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates around the specified point according to the
     * specified rotation vector.
     * @since 1.6
     */
    static getRotateInstance$double$double$double$double(vecx: number, vecy: number, anchorx: number, anchory: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates around an anchor
     * point according to a rotation vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * an identity transform is returned.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(Math.atan2(vecy, vecx),
     * anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates around the specified point according to the
     * specified rotation vector.
     * @since 1.6
     */
    static getRotateInstance(vecx?: any, vecy?: any, anchorx?: any, anchory?: any): any;
    /**
     * Returns a transform that rotates coordinates by the specified
     * number of quadrants.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(numquadrants * Math.PI / 2.0);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates by the specified number of quadrants.
     * @since 1.6
     */
    static getQuadrantRotateInstance$int(numquadrants: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates by the specified
     * number of quadrants around the specified anchor point.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(numquadrants * Math.PI / 2.0,
     * anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates by the specified number of quadrants around the
     * specified anchor point.
     * @since 1.6
     */
    static getQuadrantRotateInstance$int$double$double(numquadrants: number, anchorx: number, anchory: number): AffineTransform;
    /**
     * Returns a transform that rotates coordinates by the specified
     * number of quadrants around the specified anchor point.
     * This operation is equivalent to calling:
     * <pre>
     * AffineTransform.getRotateInstance(numquadrants * Math.PI / 2.0,
     * anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @return {AffineTransform} an <code>AffineTransform</code> object that rotates
     * coordinates by the specified number of quadrants around the
     * specified anchor point.
     * @since 1.6
     */
    static getQuadrantRotateInstance(numquadrants?: any, anchorx?: any, anchory?: any): any;
    /**
     * Returns a transform representing a scaling transformation.
     * The matrix representing the returned transform is:
     * <pre>
     * [   sx   0    0   ]
     * [   0    sy   0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} sx the factor by which coordinates are scaled along the
     * X axis direction
     * @param {number} sy the factor by which coordinates are scaled along the
     * Y axis direction
     * @return {AffineTransform} an <code>AffineTransform</code> object that scales
     * coordinates by the specified factors.
     * @since 1.2
     */
    static getScaleInstance(sx: number, sy: number): AffineTransform;
    /**
     * Returns a transform representing a shearing transformation.
     * The matrix representing the returned transform is:
     * <pre>
     * [   1   shx   0   ]
     * [  shy   1    0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} shx the multiplier by which coordinates are shifted in the
     * direction of the positive X axis as a factor of their Y coordinate
     * @param {number} shy the multiplier by which coordinates are shifted in the
     * direction of the positive Y axis as a factor of their X coordinate
     * @return {AffineTransform} an <code>AffineTransform</code> object that shears
     * coordinates by the specified multipliers.
     * @since 1.2
     */
    static getShearInstance(shx: number, shy: number): AffineTransform;
    /**
     * Retrieves the flag bits describing the conversion properties of
     * this transform.
     * The return value is either one of the constants TYPE_IDENTITY
     * or TYPE_GENERAL_TRANSFORM, or a combination of the
     * appropriate flag bits.
     * A valid combination of flag bits is an exclusive OR operation
     * that can combine
     * the TYPE_TRANSLATION flag bit
     * in addition to either of the
     * TYPE_UNIFORM_SCALE or TYPE_GENERAL_SCALE flag bits
     * as well as either of the
     * TYPE_QUADRANT_ROTATION or TYPE_GENERAL_ROTATION flag bits.
     * @return {number} the OR combination of any of the indicated flags that
     * apply to this transform
     * @see #TYPE_IDENTITY
     * @see #TYPE_TRANSLATION
     * @see #TYPE_UNIFORM_SCALE
     * @see #TYPE_GENERAL_SCALE
     * @see #TYPE_QUADRANT_ROTATION
     * @see #TYPE_GENERAL_ROTATION
     * @see #TYPE_GENERAL_TRANSFORM
     * @since 1.2
     */
    getType(): number;
    /**
     * This is the utility function to calculate the flag bits when
     * they have not been cached.
     * @see #getType
     * @private
     */
    private calculateType();
    /**
     * Returns the determinant of the matrix representation of the transform.
     * The determinant is useful both to determine if the transform can
     * be inverted and to get a single value representing the
     * combined X and Y scaling of the transform.
     * <p>
     * If the determinant is non-zero, then this transform is
     * invertible and the various methods that depend on the inverse
     * transform do not need to throw a
     * {@link NoninvertibleTransformException}.
     * If the determinant is zero then this transform can not be
     * inverted since the transform maps all input coordinates onto
     * a line or a point.
     * If the determinant is near enough to zero then inverse transform
     * operations might not carry enough precision to produce meaningful
     * results.
     * <p>
     * If this transform represents a uniform scale, as indicated by
     * the <code>getType</code> method then the determinant also
     * represents the square of the uniform scale factor by which all of
     * the points are expanded from or contracted towards the origin.
     * If this transform represents a non-uniform scale or more general
     * transform then the determinant is not likely to represent a
     * value useful for any purpose other than determining if inverse
     * transforms are possible.
     * <p>
     * Mathematically, the determinant is calculated using the formula:
     * <pre>
     * |  m00  m01  m02  |
     * |  m10  m11  m12  |  =  m00 * m11 - m01 * m10
     * |   0    0    1   |
     * </pre>
     *
     * @return {number} the determinant of the matrix used to transform the
     * coordinates.
     * @see #getType
     * @see #createInverse
     * @see #inverseTransform
     * @see #TYPE_UNIFORM_SCALE
     * @since 1.2
     */
    getDeterminant(): number;
    /**
     * Manually recalculates the state of the transform when the matrix
     * changes too much to predict the effects on the state.
     * The following table specifies what the various settings of the
     * state field say about the values of the corresponding matrix
     * element fields.
     * Note that the rules governing the SCALE fields are slightly
     * different depending on whether the SHEAR flag is also set.
     * <pre>
     * SCALE            SHEAR          TRANSLATE
     * m00/m11          m01/m10          m02/m12
     *
     * IDENTITY             1.0              0.0              0.0
     * TRANSLATE (TR)       1.0              0.0          not both 0.0
     * SCALE (SC)       not both 1.0         0.0              0.0
     * TR | SC          not both 1.0         0.0          not both 0.0
     * SHEAR (SH)           0.0          not both 0.0         0.0
     * TR | SH              0.0          not both 0.0     not both 0.0
     * SC | SH          not both 0.0     not both 0.0         0.0
     * TR | SC | SH     not both 0.0     not both 0.0     not both 0.0
     * </pre>
     */
    updateState(): void;
    private stateError();
    /**
     * Retrieves the 6 specifiable values in the 3x3 affine transformation
     * matrix and places them into an array of double precisions values.
     * The values are stored in the array as
     * {&nbsp;m00&nbsp;m10&nbsp;m01&nbsp;m11&nbsp;m02&nbsp;m12&nbsp;}.
     * An array of 4 doubles can also be specified, in which case only the
     * first four elements representing the non-transform
     * parts of the array are retrieved and the values are stored into
     * the array as {&nbsp;m00&nbsp;m10&nbsp;m01&nbsp;m11&nbsp;}
     * @param {Array} flatmatrix the double array used to store the returned
     * values.
     * @see #getScaleX
     * @see #getScaleY
     * @see #getShearX
     * @see #getShearY
     * @see #getTranslateX
     * @see #getTranslateY
     * @since 1.2
     */
    getMatrix(flatmatrix: number[]): void;
    /**
     * Returns the X coordinate scaling element (m00) of the 3x3
     * affine transformation matrix.
     * @return {number} a double value that is the X coordinate of the scaling
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getScaleX(): number;
    /**
     * Returns the Y coordinate scaling element (m11) of the 3x3
     * affine transformation matrix.
     * @return {number} a double value that is the Y coordinate of the scaling
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getScaleY(): number;
    /**
     * Returns the X coordinate shearing element (m01) of the 3x3
     * affine transformation matrix.
     * @return {number} a double value that is the X coordinate of the shearing
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getShearX(): number;
    /**
     * Returns the Y coordinate shearing element (m10) of the 3x3
     * affine transformation matrix.
     * @return {number} a double value that is the Y coordinate of the shearing
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getShearY(): number;
    /**
     * Returns the X coordinate of the translation element (m02) of the
     * 3x3 affine transformation matrix.
     * @return {number} a double value that is the X coordinate of the translation
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getTranslateX(): number;
    /**
     * Returns the Y coordinate of the translation element (m12) of the
     * 3x3 affine transformation matrix.
     * @return {number} a double value that is the Y coordinate of the translation
     * element of the affine transformation matrix.
     * @see #getMatrix
     * @since 1.2
     */
    getTranslateY(): number;
    /**
     * Concatenates this transform with a translation transformation.
     * This is equivalent to calling concatenate(T), where T is an
     * <code>AffineTransform</code> represented by the following matrix:
     * <pre>
     * [   1    0    tx  ]
     * [   0    1    ty  ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} tx the distance by which coordinates are translated in the
     * X axis direction
     * @param {number} ty the distance by which coordinates are translated in the
     * Y axis direction
     * @since 1.2
     */
    translate(tx: number, ty: number): void;
    static rot90conversion: number[];
    static rot90conversion_$LI$(): number[];
    private rotate90();
    private rotate180();
    private rotate270();
    /**
     * Concatenates this transform with a rotation transformation.
     * This is equivalent to calling concatenate(R), where R is an
     * <code>AffineTransform</code> represented by the following matrix:
     * <pre>
     * [   cos(theta)    -sin(theta)    0   ]
     * [   sin(theta)     cos(theta)    0   ]
     * [       0              0         1   ]
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     * @param {number} theta the angle of rotation measured in radians
     * @since 1.2
     */
    rotate$double(theta: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates around an anchor point.
     * This operation is equivalent to translating the coordinates so
     * that the anchor point is at the origin (S1), then rotating them
     * about the new origin (S2), and finally translating so that the
     * intermediate origin is restored to the coordinates of the original
     * anchor point (S3).
     * <p>
     * This operation is equivalent to the following sequence of calls:
     * <pre>
     * translate(anchorx, anchory);      // S3: final translation
     * rotate(theta);                    // S2: rotate around anchor
     * translate(-anchorx, -anchory);    // S1: translate anchor to origin
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     *
     * @param {number} theta the angle of rotation measured in radians
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.2
     */
    rotate$double$double$double(theta: number, anchorx: number, anchory: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates according to a rotation vector.
     * All coordinates rotate about the origin by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * no additional rotation is added to this transform.
     * This operation is equivalent to calling:
     * <pre>
     * rotate(Math.atan2(vecy, vecx));
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @since 1.6
     */
    rotate$double$double(vecx: number, vecy: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates around an anchor point according to a rotation
     * vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * the transform is not modified in any way.
     * This method is equivalent to calling:
     * <pre>
     * rotate(Math.atan2(vecy, vecx), anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    rotate$double$double$double$double(vecx: number, vecy: number, anchorx: number, anchory: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates around an anchor point according to a rotation
     * vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * the transform is not modified in any way.
     * This method is equivalent to calling:
     * <pre>
     * rotate(Math.atan2(vecy, vecx), anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    rotate(vecx?: any, vecy?: any, anchorx?: any, anchory?: any): any;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates by the specified number of quadrants.
     * This is equivalent to calling:
     * <pre>
     * rotate(numquadrants * Math.PI / 2.0);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @since 1.6
     */
    quadrantRotate$int(numquadrants: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates by the specified number of quadrants around
     * the specified anchor point.
     * This method is equivalent to calling:
     * <pre>
     * rotate(numquadrants * Math.PI / 2.0, anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    quadrantRotate$int$double$double(numquadrants: number, anchorx: number, anchory: number): void;
    /**
     * Concatenates this transform with a transform that rotates
     * coordinates by the specified number of quadrants around
     * the specified anchor point.
     * This method is equivalent to calling:
     * <pre>
     * rotate(numquadrants * Math.PI / 2.0, anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    quadrantRotate(numquadrants?: any, anchorx?: any, anchory?: any): any;
    /**
     * Concatenates this transform with a scaling transformation.
     * This is equivalent to calling concatenate(S), where S is an
     * <code>AffineTransform</code> represented by the following matrix:
     * <pre>
     * [   sx   0    0   ]
     * [   0    sy   0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} sx the factor by which coordinates are scaled along the
     * X axis direction
     * @param {number} sy the factor by which coordinates are scaled along the
     * Y axis direction
     * @since 1.2
     */
    scale(sx: number, sy: number): void;
    /**
     * Concatenates this transform with a shearing transformation.
     * This is equivalent to calling concatenate(SH), where SH is an
     * <code>AffineTransform</code> represented by the following matrix:
     * <pre>
     * [   1   shx   0   ]
     * [  shy   1    0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} shx the multiplier by which coordinates are shifted in the
     * direction of the positive X axis as a factor of their Y coordinate
     * @param {number} shy the multiplier by which coordinates are shifted in the
     * direction of the positive Y axis as a factor of their X coordinate
     * @since 1.2
     */
    shear(shx: number, shy: number): void;
    /**
     * Resets this transform to the Identity transform.
     * @since 1.2
     */
    setToIdentity(): void;
    /**
     * Sets this transform to a translation transformation.
     * The matrix representing this transform becomes:
     * <pre>
     * [   1    0    tx  ]
     * [   0    1    ty  ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} tx the distance by which coordinates are translated in the
     * X axis direction
     * @param {number} ty the distance by which coordinates are translated in the
     * Y axis direction
     * @since 1.2
     */
    setToTranslation(tx: number, ty: number): void;
    /**
     * Sets this transform to a rotation transformation.
     * The matrix representing this transform becomes:
     * <pre>
     * [   cos(theta)    -sin(theta)    0   ]
     * [   sin(theta)     cos(theta)    0   ]
     * [       0              0         1   ]
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     * @param {number} theta the angle of rotation measured in radians
     * @since 1.2
     */
    setToRotation$double(theta: number): void;
    /**
     * Sets this transform to a translated rotation transformation.
     * This operation is equivalent to translating the coordinates so
     * that the anchor point is at the origin (S1), then rotating them
     * about the new origin (S2), and finally translating so that the
     * intermediate origin is restored to the coordinates of the original
     * anchor point (S3).
     * <p>
     * This operation is equivalent to the following sequence of calls:
     * <pre>
     * setToTranslation(anchorx, anchory); // S3: final translation
     * rotate(theta);                      // S2: rotate around anchor
     * translate(-anchorx, -anchory);      // S1: translate anchor to origin
     * </pre>
     * The matrix representing this transform becomes:
     * <pre>
     * [   cos(theta)    -sin(theta)    x-x*cos+y*sin  ]
     * [   sin(theta)     cos(theta)    y-x*sin-y*cos  ]
     * [       0              0               1        ]
     * </pre>
     * Rotating by a positive angle theta rotates points on the positive
     * X axis toward the positive Y axis.
     * Note also the discussion of
     * <a href="#quadrantapproximation">Handling 90-Degree Rotations</a>
     * above.
     *
     * @param {number} theta the angle of rotation measured in radians
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.2
     */
    setToRotation$double$double$double(theta: number, anchorx: number, anchory: number): void;
    /**
     * Sets this transform to a rotation transformation that rotates
     * coordinates according to a rotation vector.
     * All coordinates rotate about the origin by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * the transform is set to an identity transform.
     * This operation is equivalent to calling:
     * <pre>
     * setToRotation(Math.atan2(vecy, vecx));
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @since 1.6
     */
    setToRotation$double$double(vecx: number, vecy: number): void;
    /**
     * Sets this transform to a rotation transformation that rotates
     * coordinates around an anchor point according to a rotation
     * vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * the transform is set to an identity transform.
     * This operation is equivalent to calling:
     * <pre>
     * setToTranslation(Math.atan2(vecy, vecx), anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    setToRotation$double$double$double$double(vecx: number, vecy: number, anchorx: number, anchory: number): void;
    /**
     * Sets this transform to a rotation transformation that rotates
     * coordinates around an anchor point according to a rotation
     * vector.
     * All coordinates rotate about the specified anchor coordinates
     * by the same amount.
     * The amount of rotation is such that coordinates along the former
     * positive X axis will subsequently align with the vector pointing
     * from the origin to the specified vector coordinates.
     * If both <code>vecx</code> and <code>vecy</code> are 0.0,
     * the transform is set to an identity transform.
     * This operation is equivalent to calling:
     * <pre>
     * setToTranslation(Math.atan2(vecy, vecx), anchorx, anchory);
     * </pre>
     *
     * @param {number} vecx the X coordinate of the rotation vector
     * @param {number} vecy the Y coordinate of the rotation vector
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    setToRotation(vecx?: any, vecy?: any, anchorx?: any, anchory?: any): any;
    /**
     * Sets this transform to a rotation transformation that rotates
     * coordinates by the specified number of quadrants.
     * This operation is equivalent to calling:
     * <pre>
     * setToRotation(numquadrants * Math.PI / 2.0);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @since 1.6
     */
    setToQuadrantRotation$int(numquadrants: number): void;
    /**
     * Sets this transform to a translated rotation transformation
     * that rotates coordinates by the specified number of quadrants
     * around the specified anchor point.
     * This operation is equivalent to calling:
     * <pre>
     * setToRotation(numquadrants * Math.PI / 2.0, anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    setToQuadrantRotation$int$double$double(numquadrants: number, anchorx: number, anchory: number): void;
    /**
     * Sets this transform to a translated rotation transformation
     * that rotates coordinates by the specified number of quadrants
     * around the specified anchor point.
     * This operation is equivalent to calling:
     * <pre>
     * setToRotation(numquadrants * Math.PI / 2.0, anchorx, anchory);
     * </pre>
     * Rotating by a positive number of quadrants rotates points on
     * the positive X axis toward the positive Y axis.
     *
     * @param {number} numquadrants the number of 90 degree arcs to rotate by
     * @param {number} anchorx the X coordinate of the rotation anchor point
     * @param {number} anchory the Y coordinate of the rotation anchor point
     * @since 1.6
     */
    setToQuadrantRotation(numquadrants?: any, anchorx?: any, anchory?: any): any;
    /**
     * Sets this transform to a scaling transformation.
     * The matrix representing this transform becomes:
     * <pre>
     * [   sx   0    0   ]
     * [   0    sy   0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} sx the factor by which coordinates are scaled along the
     * X axis direction
     * @param {number} sy the factor by which coordinates are scaled along the
     * Y axis direction
     * @since 1.2
     */
    setToScale(sx: number, sy: number): void;
    /**
     * Sets this transform to a shearing transformation.
     * The matrix representing this transform becomes:
     * <pre>
     * [   1   shx   0   ]
     * [  shy   1    0   ]
     * [   0    0    1   ]
     * </pre>
     * @param {number} shx the multiplier by which coordinates are shifted in the
     * direction of the positive X axis as a factor of their Y coordinate
     * @param {number} shy the multiplier by which coordinates are shifted in the
     * direction of the positive Y axis as a factor of their X coordinate
     * @since 1.2
     */
    setToShear(shx: number, shy: number): void;
    /**
     * Sets this transform to a copy of the transform in the specified
     * <code>AffineTransform</code> object.
     * @param {AffineTransform} Tx the <code>AffineTransform</code> object from which to
     * copy the transform
     * @since 1.2
     */
    setTransform$java_awt_geom_AffineTransform(Tx: AffineTransform): void;
    /**
     * Sets this transform to the matrix specified by the 6
     * double precision values.
     *
     * @param {number} m00 the X coordinate scaling element of the 3x3 matrix
     * @param {number} m10 the Y coordinate shearing element of the 3x3 matrix
     * @param {number} m01 the X coordinate shearing element of the 3x3 matrix
     * @param {number} m11 the Y coordinate scaling element of the 3x3 matrix
     * @param {number} m02 the X coordinate translation element of the 3x3 matrix
     * @param {number} m12 the Y coordinate translation element of the 3x3 matrix
     * @since 1.2
     */
    setTransform$double$double$double$double$double$double(m00: number, m10: number, m01: number, m11: number, m02: number, m12: number): void;
    /**
     * Sets this transform to the matrix specified by the 6
     * double precision values.
     *
     * @param {number} m00 the X coordinate scaling element of the 3x3 matrix
     * @param {number} m10 the Y coordinate shearing element of the 3x3 matrix
     * @param {number} m01 the X coordinate shearing element of the 3x3 matrix
     * @param {number} m11 the Y coordinate scaling element of the 3x3 matrix
     * @param {number} m02 the X coordinate translation element of the 3x3 matrix
     * @param {number} m12 the Y coordinate translation element of the 3x3 matrix
     * @since 1.2
     */
    setTransform(m00?: any, m10?: any, m01?: any, m11?: any, m02?: any, m12?: any): any;
    /**
     * Concatenates an <code>AffineTransform</code> <code>Tx</code> to
     * this <code>AffineTransform</code> Cx in the most commonly useful
     * way to provide a new user space
     * that is mapped to the former user space by <code>Tx</code>.
     * Cx is updated to perform the combined transformation.
     * Transforming a point p by the updated transform Cx' is
     * equivalent to first transforming p by <code>Tx</code> and then
     * transforming the result by the original transform Cx like this:
     * Cx'(p) = Cx(Tx(p))
     * In matrix notation, if this transform Cx is
     * represented by the matrix [this] and <code>Tx</code> is represented
     * by the matrix [Tx] then this method does the following:
     * <pre>
     * [this] = [this] x [Tx]
     * </pre>
     * @param {AffineTransform} Tx the <code>AffineTransform</code> object to be
     * concatenated with this <code>AffineTransform</code> object.
     * @see #preConcatenate
     * @since 1.2
     */
    concatenate(Tx: AffineTransform): void;
    /**
     * Concatenates an <code>AffineTransform</code> <code>Tx</code> to
     * this <code>AffineTransform</code> Cx
     * in a less commonly used way such that <code>Tx</code> modifies the
     * coordinate transformation relative to the absolute pixel
     * space rather than relative to the existing user space.
     * Cx is updated to perform the combined transformation.
     * Transforming a point p by the updated transform Cx' is
     * equivalent to first transforming p by the original transform
     * Cx and then transforming the result by
     * <code>Tx</code> like this:
     * Cx'(p) = Tx(Cx(p))
     * In matrix notation, if this transform Cx
     * is represented by the matrix [this] and <code>Tx</code> is
     * represented by the matrix [Tx] then this method does the
     * following:
     * <pre>
     * [this] = [Tx] x [this]
     * </pre>
     * @param {AffineTransform} Tx the <code>AffineTransform</code> object to be
     * concatenated with this <code>AffineTransform</code> object.
     * @see #concatenate
     * @since 1.2
     */
    preConcatenate(Tx: AffineTransform): void;
    /**
     * Returns an <code>AffineTransform</code> object representing the
     * inverse transformation.
     * The inverse transform Tx' of this transform Tx
     * maps coordinates transformed by Tx back
     * to their original coordinates.
     * In other words, Tx'(Tx(p)) = p = Tx(Tx'(p)).
     * <p>
     * If this transform maps all coordinates onto a point or a line
     * then it will not have an inverse, since coordinates that do
     * not lie on the destination point or line will not have an inverse
     * mapping.
     * The <code>getDeterminant</code> method can be used to determine if this
     * transform has no inverse, in which case an exception will be
     * thrown if the <code>createInverse</code> method is called.
     * @return {AffineTransform} a new <code>AffineTransform</code> object representing the
     * inverse transformation.
     * @see #getDeterminant
     * @exception NoninvertibleTransformException
     * if the matrix cannot be inverted.
     * @since 1.2
     */
    createInverse(): AffineTransform;
    /**
     * Sets this transform to the inverse of itself.
     * The inverse transform Tx' of this transform Tx
     * maps coordinates transformed by Tx back
     * to their original coordinates.
     * In other words, Tx'(Tx(p)) = p = Tx(Tx'(p)).
     * <p>
     * If this transform maps all coordinates onto a point or a line
     * then it will not have an inverse, since coordinates that do
     * not lie on the destination point or line will not have an inverse
     * mapping.
     * The <code>getDeterminant</code> method can be used to determine if this
     * transform has no inverse, in which case an exception will be
     * thrown if the <code>invert</code> method is called.
     * @see #getDeterminant
     * @exception NoninvertibleTransformException
     * if the matrix cannot be inverted.
     * @since 1.6
     */
    invert(): void;
    /**
     * Transforms the specified <code>ptSrc</code> and stores the result
     * in <code>ptDst</code>.
     * If <code>ptDst</code> is <code>null</code>, a new {@link Point2D}
     * object is allocated and then the result of the transformation is
     * stored in this object.
     * In either case, <code>ptDst</code>, which contains the
     * transformed point, is returned for convenience.
     * If <code>ptSrc</code> and <code>ptDst</code> are the same
     * object, the input point is correctly overwritten with
     * the transformed point.
     * @param {Point2D} ptSrc the specified <code>Point2D</code> to be transformed
     * @param {Point2D} ptDst the specified <code>Point2D</code> that stores the
     * result of transforming <code>ptSrc</code>
     * @return {Point2D} the <code>ptDst</code> after transforming
     * <code>ptSrc</code> and storing the result in <code>ptDst</code>.
     * @since 1.2
     */
    transform$java_awt_geom_Point2D$java_awt_geom_Point2D(ptSrc: Point2D, ptDst: Point2D): Point2D;
    /**
     * Transforms an array of point objects by this transform.
     * If any element of the <code>ptDst</code> array is
     * <code>null</code>, a new <code>Point2D</code> object is allocated
     * and stored into that element before storing the results of the
     * transformation.
     * <p>
     * Note that this method does not take any precautions to
     * avoid problems caused by storing results into <code>Point2D</code>
     * objects that will be used as the source for calculations
     * further down the source array.
     * This method does guarantee that if a specified <code>Point2D</code>
     * object is both the source and destination for the same single point
     * transform operation then the results will not be stored until
     * the calculations are complete to avoid storing the results on
     * top of the operands.
     * If, however, the destination <code>Point2D</code> object for one
     * operation is the same object as the source <code>Point2D</code>
     * object for another operation further down the source array then
     * the original coordinates in that point are overwritten before
     * they can be converted.
     * @param {Array} ptSrc the array containing the source point objects
     * @param {Array} ptDst the array into which the transform point objects are
     * returned
     * @param {number} srcOff the offset to the first point object to be
     * transformed in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point object that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @since 1.2
     */
    transform$java_awt_geom_Point2D_A$int$java_awt_geom_Point2D_A$int$int(ptSrc: Point2D[], srcOff: number, ptDst: Point2D[], dstOff: number, numPts: number): void;
    /**
     * Transforms an array of point objects by this transform.
     * If any element of the <code>ptDst</code> array is
     * <code>null</code>, a new <code>Point2D</code> object is allocated
     * and stored into that element before storing the results of the
     * transformation.
     * <p>
     * Note that this method does not take any precautions to
     * avoid problems caused by storing results into <code>Point2D</code>
     * objects that will be used as the source for calculations
     * further down the source array.
     * This method does guarantee that if a specified <code>Point2D</code>
     * object is both the source and destination for the same single point
     * transform operation then the results will not be stored until
     * the calculations are complete to avoid storing the results on
     * top of the operands.
     * If, however, the destination <code>Point2D</code> object for one
     * operation is the same object as the source <code>Point2D</code>
     * object for another operation further down the source array then
     * the original coordinates in that point are overwritten before
     * they can be converted.
     * @param {Array} ptSrc the array containing the source point objects
     * @param {Array} ptDst the array into which the transform point objects are
     * returned
     * @param {number} srcOff the offset to the first point object to be
     * transformed in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point object that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @since 1.2
     */
    transform(ptSrc?: any, srcOff?: any, ptDst?: any, dstOff?: any, numPts?: any): any;
    /**
     * Transforms an array of floating point coordinates by this transform.
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are overwritten by a
     * previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the specified
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point coordinates
     * are returned.  Each point is stored as a pair of x,&nbsp;y
     * coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of points to be transformed
     * @since 1.2
     */
    transform$float_A$int$float_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Transforms an array of double precision coordinates by this transform.
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are
     * overwritten by a previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the indicated
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point
     * coordinates are returned.  Each point is stored as a pair of
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @since 1.2
     */
    transform$double_A$int$double_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Transforms an array of floating point coordinates by this transform
     * and stores the results into an array of doubles.
     * The coordinates are stored in the arrays starting at the specified
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point coordinates
     * are returned.  Each point is stored as a pair of x,&nbsp;y
     * coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of points to be transformed
     * @since 1.2
     */
    transform$float_A$int$double_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Transforms an array of double precision coordinates by this transform
     * and stores the results into an array of floats.
     * The coordinates are stored in the arrays starting at the specified
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point
     * coordinates are returned.  Each point is stored as a pair of
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @since 1.2
     */
    transform$double_A$int$float_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Inverse transforms the specified <code>ptSrc</code> and stores the
     * result in <code>ptDst</code>.
     * If <code>ptDst</code> is <code>null</code>, a new
     * <code>Point2D</code> object is allocated and then the result of the
     * transform is stored in this object.
     * In either case, <code>ptDst</code>, which contains the transformed
     * point, is returned for convenience.
     * If <code>ptSrc</code> and <code>ptDst</code> are the same
     * object, the input point is correctly overwritten with the
     * transformed point.
     * @param {Point2D} ptSrc the point to be inverse transformed
     * @param {Point2D} ptDst the resulting transformed point
     * @return {Point2D} <code>ptDst</code>, which contains the result of the
     * inverse transform.
     * @exception NoninvertibleTransformException  if the matrix cannot be
     * inverted.
     * @since 1.2
     */
    inverseTransform$java_awt_geom_Point2D$java_awt_geom_Point2D(ptSrc: Point2D, ptDst: Point2D): Point2D;
    /**
     * Inverse transforms an array of double precision coordinates by
     * this transform.
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are
     * overwritten by a previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the specified
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point
     * coordinates are returned.  Each point is stored as a pair of
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @exception NoninvertibleTransformException  if the matrix cannot be
     * inverted.
     * @since 1.2
     */
    inverseTransform$double_A$int$double_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Inverse transforms an array of double precision coordinates by
     * this transform.
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are
     * overwritten by a previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the specified
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source point coordinates.
     * Each point is stored as a pair of x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed point
     * coordinates are returned.  Each point is stored as a pair of
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first point to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed point that is stored in the destination array
     * @param {number} numPts the number of point objects to be transformed
     * @exception NoninvertibleTransformException  if the matrix cannot be
     * inverted.
     * @since 1.2
     */
    inverseTransform(srcPts?: any, srcOff?: any, dstPts?: any, dstOff?: any, numPts?: any): any;
    /**
     * Transforms the relative distance vector specified by
     * <code>ptSrc</code> and stores the result in <code>ptDst</code>.
     * A relative distance vector is transformed without applying the
     * translation components of the affine transformation matrix
     * using the following equations:
     * <pre>
     * [  x' ]   [  m00  m01 (m02) ] [  x  ]   [ m00x + m01y ]
     * [  y' ] = [  m10  m11 (m12) ] [  y  ] = [ m10x + m11y ]
     * [ (1) ]   [  (0)  (0) ( 1 ) ] [ (1) ]   [     (1)     ]
     * </pre>
     * If <code>ptDst</code> is <code>null</code>, a new
     * <code>Point2D</code> object is allocated and then the result of the
     * transform is stored in this object.
     * In either case, <code>ptDst</code>, which contains the
     * transformed point, is returned for convenience.
     * If <code>ptSrc</code> and <code>ptDst</code> are the same object,
     * the input point is correctly overwritten with the transformed
     * point.
     * @param {Point2D} ptSrc the distance vector to be delta transformed
     * @param {Point2D} ptDst the resulting transformed distance vector
     * @return {Point2D} <code>ptDst</code>, which contains the result of the
     * transformation.
     * @since 1.2
     */
    deltaTransform$java_awt_geom_Point2D$java_awt_geom_Point2D(ptSrc: Point2D, ptDst: Point2D): Point2D;
    /**
     * Transforms an array of relative distance vectors by this
     * transform.
     * A relative distance vector is transformed without applying the
     * translation components of the affine transformation matrix
     * using the following equations:
     * <pre>
     * [  x' ]   [  m00  m01 (m02) ] [  x  ]   [ m00x + m01y ]
     * [  y' ] = [  m10  m11 (m12) ] [  y  ] = [ m10x + m11y ]
     * [ (1) ]   [  (0)  (0) ( 1 ) ] [ (1) ]   [     (1)     ]
     * </pre>
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are
     * overwritten by a previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the indicated
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source distance vectors.
     * Each vector is stored as a pair of relative x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed distance vectors
     * are returned.  Each vector is stored as a pair of relative
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first vector to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed vector that is stored in the destination array
     * @param {number} numPts the number of vector coordinate pairs to be
     * transformed
     * @since 1.2
     */
    deltaTransform$double_A$int$double_A$int$int(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void;
    /**
     * Transforms an array of relative distance vectors by this
     * transform.
     * A relative distance vector is transformed without applying the
     * translation components of the affine transformation matrix
     * using the following equations:
     * <pre>
     * [  x' ]   [  m00  m01 (m02) ] [  x  ]   [ m00x + m01y ]
     * [  y' ] = [  m10  m11 (m12) ] [  y  ] = [ m10x + m11y ]
     * [ (1) ]   [  (0)  (0) ( 1 ) ] [ (1) ]   [     (1)     ]
     * </pre>
     * The two coordinate array sections can be exactly the same or
     * can be overlapping sections of the same array without affecting the
     * validity of the results.
     * This method ensures that no source coordinates are
     * overwritten by a previous operation before they can be transformed.
     * The coordinates are stored in the arrays starting at the indicated
     * offset in the order <code>[x0, y0, x1, y1, ..., xn, yn]</code>.
     * @param {Array} srcPts the array containing the source distance vectors.
     * Each vector is stored as a pair of relative x,&nbsp;y coordinates.
     * @param {Array} dstPts the array into which the transformed distance vectors
     * are returned.  Each vector is stored as a pair of relative
     * x,&nbsp;y coordinates.
     * @param {number} srcOff the offset to the first vector to be transformed
     * in the source array
     * @param {number} dstOff the offset to the location of the first
     * transformed vector that is stored in the destination array
     * @param {number} numPts the number of vector coordinate pairs to be
     * transformed
     * @since 1.2
     */
    deltaTransform(srcPts?: any, srcOff?: any, dstPts?: any, dstOff?: any, numPts?: any): any;
    /**
     * Returns a new {@link Shape} object defined by the geometry of the
     * specified <code>Shape</code> after it has been transformed by
     * this transform.
     * @param {java.awt.Shape} pSrc the specified <code>Shape</code> object to be
     * transformed by this transform.
     * @return {java.awt.Shape} a new <code>Shape</code> object that defines the geometry
     * of the transformed <code>Shape</code>, or null if {@code pSrc} is null.
     * @since 1.2
     */
    createTransformedShape(pSrc: java.awt.Shape): java.awt.Shape;
    private static _matround(matval);
    /**
     * Returns a <code>String</code> that represents the value of this
     * {@link Object}.
     * @return {string} a <code>String</code> representing the value of this
     * <code>Object</code>.
     * @since 1.2
     */
    toString(): string;
    /**
     * Returns <code>true</code> if this <code>AffineTransform</code> is
     * an identity transform.
     * @return {boolean} <code>true</code> if this <code>AffineTransform</code> is
     * an identity transform; <code>false</code> otherwise.
     * @since 1.2
     */
    isIdentity(): boolean;
    /**
     * Returns a copy of this <code>AffineTransform</code> object.
     * @return {*} an <code>Object</code> that is a copy of this
     * <code>AffineTransform</code> object.
     * @since 1.2
     */
    clone(): any;
    /**
     * Returns <code>true</code> if this <code>AffineTransform</code>
     * represents the same affine coordinate transform as the specified
     * argument.
     * @param {*} obj the <code>Object</code> to test for equality with this
     * <code>AffineTransform</code>
     * @return {boolean} <code>true</code> if <code>obj</code> equals this
     * <code>AffineTransform</code> object; <code>false</code> otherwise.
     * @since 1.2
     */
    equals(obj: any): boolean;
    static serialVersionUID: number;
}
/**
 * A utility class to iterate over the path segments of an arc through the
 * PathIterator interface.
 *
 * @author Jim Graham
 */
declare class ArcIterator implements PathIterator {
    x: number;
    y: number;
    w: number;
    h: number;
    angStRad: number;
    increment: number;
    cv: number;
    affine: AffineTransform;
    index: number;
    arcSegs: number;
    lineSegs: number;
    constructor(a: Arc2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next(): void;
    private static btan(increment);
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * The <code>Area</code> class creates an area geometry from the specified
 * {@link Shape} object. The geometry is explicitly closed, if the
 * <code>Shape</code> is not already closed. The fill rule (even-odd or
 * winding) specified by the geometry of the <code>Shape</code> is used to
 * determine the resulting enclosed area.
 *
 * @param {java.awt.Shape} s
 * the <code>Shape</code> from which the area is constructed
 * @throws NullPointerException
 * if <code>s</code> is null
 * @since 1.2
 * @class
 */
declare class Area implements java.awt.Shape {
    static EmptyCurves: Array<any>;
    static EmptyCurves_$LI$(): Array<any>;
    curves: Array<any>;
    constructor(s?: any);
    private static pathToCurves(pi);
    /**
     * Adds the shape of the specified <code>Area</code> to the shape of this
     * <code>Area</code>. The resulting shape of this <code>Area</code> will
     * include the union of both shapes, or all areas that were contained in
     * either this or the specified <code>Area</code>.
     *
     * <pre>
     * // Example:
     * Area a1 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 0,8]);
     * Area a2 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 8,8]);
     * a1.add(a2);
     *
     * a1(before)     +         a2         =     a1(after)
     *
     * ################     ################     ################
     * ##############         ##############     ################
     * ############             ############     ################
     * ##########                 ##########     ################
     * ########                     ########     ################
     * ######                         ######     ######    ######
     * ####                             ####     ####        ####
     * ##                                 ##     ##            ##
     * </pre>
     *
     * @param {Area} rhs
     * the <code>Area</code> to be added to the current shape
     * @throws NullPointerException
     * if <code>rhs</code> is null
     * @since 1.2
     */
    add(rhs: Area): void;
    /**
     * Subtracts the shape of the specified <code>Area</code> from the shape of
     * this <code>Area</code>. The resulting shape of this <code>Area</code>
     * will include areas that were contained only in this <code>Area</code> and
     * not in the specified <code>Area</code>.
     *
     * <pre>
     * // Example:
     * Area a1 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 0,8]);
     * Area a2 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 8,8]);
     * a1.subtract(a2);
     *
     * a1(before)     -         a2         =     a1(after)
     *
     * ################     ################
     * ##############         ##############     ##
     * ############             ############     ####
     * ##########                 ##########     ######
     * ########                     ########     ########
     * ######                         ######     ######
     * ####                             ####     ####
     * ##                                 ##     ##
     * </pre>
     *
     * @param {Area} rhs
     * the <code>Area</code> to be subtracted from the current shape
     * @throws NullPointerException
     * if <code>rhs</code> is null
     * @since 1.2
     */
    subtract(rhs: Area): void;
    /**
     * Sets the shape of this <code>Area</code> to the intersection of its
     * current shape and the shape of the specified <code>Area</code>. The
     * resulting shape of this <code>Area</code> will include only areas that
     * were contained in both this <code>Area</code> and also in the specified
     * <code>Area</code>.
     *
     * <pre>
     * // Example:
     * Area a1 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 0,8]);
     * Area a2 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 8,8]);
     * a1.intersect(a2);
     *
     * a1(before)   intersect     a2         =     a1(after)
     *
     * ################     ################     ################
     * ##############         ##############       ############
     * ############             ############         ########
     * ##########                 ##########           ####
     * ########                     ########
     * ######                         ######
     * ####                             ####
     * ##                                 ##
     * </pre>
     *
     * @param {Area} rhs
     * the <code>Area</code> to be intersected with this
     * <code>Area</code>
     * @throws NullPointerException
     * if <code>rhs</code> is null
     * @since 1.2
     */
    intersect(rhs: Area): void;
    /**
     * Sets the shape of this <code>Area</code> to be the combined area of its
     * current shape and the shape of the specified <code>Area</code>, minus
     * their intersection. The resulting shape of this <code>Area</code> will
     * include only areas that were contained in either this <code>Area</code>
     * or in the specified <code>Area</code>, but not in both.
     *
     * <pre>
     * // Example:
     * Area a1 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 0,8]);
     * Area a2 = new Area([triangle 0,0 =&gt; 8,0 =&gt; 8,8]);
     * a1.exclusiveOr(a2);
     *
     * a1(before)    xor        a2         =     a1(after)
     *
     * ################     ################
     * ##############         ##############     ##            ##
     * ############             ############     ####        ####
     * ##########                 ##########     ######    ######
     * ########                     ########     ################
     * ######                         ######     ######    ######
     * ####                             ####     ####        ####
     * ##                                 ##     ##            ##
     * </pre>
     *
     * @param {Area} rhs
     * the <code>Area</code> to be exclusive ORed with this
     * <code>Area</code>.
     * @throws NullPointerException
     * if <code>rhs</code> is null
     * @since 1.2
     */
    exclusiveOr(rhs: Area): void;
    /**
     * Removes all of the geometry from this <code>Area</code> and restores it
     * to an empty area.
     *
     * @since 1.2
     */
    reset(): void;
    /**
     * Tests whether this <code>Area</code> object encloses any area.
     *
     * @return {boolean} <code>true</code> if this <code>Area</code> object represents an
     * empty area; <code>false</code> otherwise.
     * @since 1.2
     */
    isEmpty(): boolean;
    /**
     * Tests whether this <code>Area</code> consists entirely of straight edged
     * polygonal geometry.
     *
     * @return {boolean} <code>true</code> if the geometry of this <code>Area</code>
     * consists entirely of line segments; <code>false</code> otherwise.
     * @since 1.2
     */
    isPolygonal(): boolean;
    /**
     * Tests whether this <code>Area</code> is rectangular in shape.
     *
     * @return {boolean} <code>true</code> if the geometry of this <code>Area</code> is
     * rectangular in shape; <code>false</code> otherwise.
     * @since 1.2
     */
    isRectangular(): boolean;
    /**
     * Tests whether this <code>Area</code> is comprised of a single closed
     * subpath. This method returns <code>true</code> if the path contains 0 or
     * 1 subpaths, or <code>false</code> if the path contains more than 1
     * subpath. The subpaths are counted by the number of
     * {@link PathIterator#SEG_MOVETO} segments that appear in the
     * path.
     *
     * @return {boolean} <code>true</code> if the <code>Area</code> is comprised of a
     * single basic geometry; <code>false</code> otherwise.
     * @since 1.2
     */
    isSingular(): boolean;
    cachedBounds: Rectangle2D;
    private invalidateBounds();
    private getCachedBounds();
    /**
     * Returns a high precision bounding {@link Rectangle2D} that completely
     * encloses this <code>Area</code>.
     * <p>
     * The Area class will attempt to return the tightest bounding box possible
     * for the Shape. The bounding box will not be padded to include the control
     * points of curves in the outline of the Shape, but should tightly fit the
     * actual geometry of the outline itself.
     *
     * @return {Rectangle2D} the bounding <code>Rectangle2D</code> for the <code>Area</code>.
     * @since 1.2
     */
    getBounds2D(): Rectangle2D;
    /**
     * Returns an exact copy of this <code>Area</code> object.
     *
     * @return {*} Created clone object
     * @since 1.2
     */
    clone(): any;
    /**
     * Tests whether the geometries of the two <code>Area</code> objects are
     * equal. This method will return false if the argument is null.
     *
     * @param {Area} other
     * the <code>Area</code> to be compared to this <code>Area</code>
     * @return {boolean} <code>true</code> if the two geometries are equal;
     * <code>false</code> otherwise.
     * @since 1.2
     */
    equals(other: Area): boolean;
    /**
     * Transforms the geometry of this <code>Area</code> using the specified
     * {@link AffineTransform}. The geometry is transformed in place, which
     * permanently changes the enclosed area defined by this object.
     *
     * @param {AffineTransform} t
     * the transformation used to transform the area
     * @throws NullPointerException
     * if <code>t</code> is null
     * @since 1.2
     */
    transform(t: AffineTransform): void;
    /**
     * Creates a new <code>Area</code> object that contains the same geometry as
     * this <code>Area</code> transformed by the specified
     * <code>AffineTransform</code>. This <code>Area</code> object is unchanged.
     *
     * @param {AffineTransform} t
     * the specified <code>AffineTransform</code> used to transform
     * the new <code>Area</code>
     * @throws NullPointerException
     * if <code>t</code> is null
     * @return {Area} a new <code>Area</code> object representing the transformed
     * geometry.
     * @since 1.2
     */
    createTransformedArea(t: AffineTransform): Area;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Point2D} p
     * @return {boolean}
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Creates a {@link PathIterator} for the outline of this <code>Area</code>
     * object. This <code>Area</code> object is unchanged.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Area</code>, one segment at a time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Creates a <code>PathIterator</code> for the flattened outline of this
     * <code>Area</code> object. Only uncurved path segments represented by the
     * SEG_MOVETO, SEG_LINETO, and SEG_CLOSE point types are returned by the
     * iterator. This <code>Area</code> object is unchanged.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Area</code>, one segment at a time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Creates a <code>PathIterator</code> for the flattened outline of this
     * <code>Area</code> object. Only uncurved path segments represented by the
     * SEG_MOVETO, SEG_LINETO, and SEG_CLOSE point types are returned by the
     * iterator. This <code>Area</code> object is unchanged.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Area</code>, one segment at a time.
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
}
declare class AreaIterator implements PathIterator {
    transform: AffineTransform;
    curves: Array<any>;
    index: number;
    prevcurve: sun.awt.geom.Curve;
    thiscurve: sun.awt.geom.Curve;
    constructor(curves: Array<any>, at: AffineTransform);
    getWindingRule(): number;
    isDone(): boolean;
    next(): void;
    currentSegment$float_A(coords: number[]): number;
    currentSegment(coords?: any): any;
    currentSegment$double_A(coords: number[]): number;
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.CubicCurve2D.Float
 * @see java.awt.geom.CubicCurve2D.Double
 * @since 1.2
 * @class
 */
declare abstract class CubicCurve2D implements java.awt.Shape {
    abstract getBounds2D(): any;
    constructor();
    /**
     * Returns the X coordinate of the start point in double precision.
     *
     * @return {number} the X coordinate of the start point of the {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getX1(): number;
    /**
     * Returns the Y coordinate of the start point in double precision.
     *
     * @return {number} the Y coordinate of the start point of the {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getY1(): number;
    /**
     * Returns the start point.
     *
     * @return {Point2D} a {@code Point2D} that is the start point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getP1(): Point2D;
    /**
     * Returns the X coordinate of the first control point in double precision.
     *
     * @return {number} the X coordinate of the first control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlX1(): number;
    /**
     * Returns the Y coordinate of the first control point in double precision.
     *
     * @return {number} the Y coordinate of the first control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlY1(): number;
    /**
     * Returns the first control point.
     *
     * @return {Point2D} a {@code Point2D} that is the first control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlP1(): Point2D;
    /**
     * Returns the X coordinate of the second control point in double precision.
     *
     * @return {number} the X coordinate of the second control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlX2(): number;
    /**
     * Returns the Y coordinate of the second control point in double precision.
     *
     * @return {number} the Y coordinate of the second control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlY2(): number;
    /**
     * Returns the second control point.
     *
     * @return {Point2D} a {@code Point2D} that is the second control point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getCtrlP2(): Point2D;
    /**
     * Returns the X coordinate of the end point in double precision.
     *
     * @return {number} the X coordinate of the end point of the {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getX2(): number;
    /**
     * Returns the Y coordinate of the end point in double precision.
     *
     * @return {number} the Y coordinate of the end point of the {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getY2(): number;
    /**
     * Returns the end point.
     *
     * @return {Point2D} a {@code Point2D} that is the end point of the
     * {@code CubicCurve2D}.
     * @since 1.2
     */
    abstract getP2(): Point2D;
    /**
     * Sets the location of the end points and control points of this curve
     * to the specified {@code float} coordinates.
     *
     * @param {number} x1
     * the X coordinate used to set the start point of this
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate used to set the start point of this
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate used to set the first control point of
     * this {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate used to set the first control point of
     * this {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate used to set the second control point of
     * this {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate used to set the second control point of
     * this {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate used to set the end point of this
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate used to set the end point of this
     * {@code CubicCurve2D}
     * @since 1.2
     */
    setCurve(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any): any;
    /**
     * Sets the location of the end points and control points of this curve to
     * the specified double coordinates.
     *
     * @param {number} x1
     * the X coordinate used to set the start point of this
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate used to set the start point of this
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate used to set the first control point of this
     * {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate used to set the first control point of this
     * {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate used to set the second control point of this
     * {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate used to set the second control point of this
     * {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate used to set the end point of this
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate used to set the end point of this
     * {@code CubicCurve2D}
     * @since 1.2
     */
    setCurve$double$double$double$double$double$double$double$double(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): void;
    /**
     * Sets the location of the end points and control points of this curve to
     * the double coordinates at the specified offset in the specified array.
     *
     * @param {Array} coords
     * a double array containing coordinates
     * @param {number} offset
     * the index of <code>coords</code> from which to begin setting
     * the end points and control points of this curve to the
     * coordinates contained in <code>coords</code>
     * @since 1.2
     */
    setCurve$double_A$int(coords: number[], offset: number): void;
    /**
     * Sets the location of the end points and control points of this curve to
     * the specified <code>Point2D</code> coordinates.
     *
     * @param {Point2D} p1
     * the first specified <code>Point2D</code> used to set the start
     * point of this curve
     * @param {Point2D} cp1
     * the second specified <code>Point2D</code> used to set the
     * first control point of this curve
     * @param {Point2D} cp2
     * the third specified <code>Point2D</code> used to set the
     * second control point of this curve
     * @param {Point2D} p2
     * the fourth specified <code>Point2D</code> used to set the end
     * point of this curve
     * @since 1.2
     */
    setCurve$java_awt_geom_Point2D$java_awt_geom_Point2D$java_awt_geom_Point2D$java_awt_geom_Point2D(p1: Point2D, cp1: Point2D, cp2: Point2D, p2: Point2D): void;
    /**
     * Sets the location of the end points and control points of this curve to
     * the coordinates of the <code>Point2D</code> objects at the specified
     * offset in the specified array.
     *
     * @param {Array} pts
     * an array of <code>Point2D</code> objects
     * @param {number} offset
     * the index of <code>pts</code> from which to begin setting the
     * end points and control points of this curve to the points
     * contained in <code>pts</code>
     * @since 1.2
     */
    setCurve$java_awt_geom_Point2D_A$int(pts: Point2D[], offset: number): void;
    /**
     * Sets the location of the end points and control points of this curve to
     * the same as those in the specified <code>CubicCurve2D</code>.
     *
     * @param {CubicCurve2D} c
     * the specified <code>CubicCurve2D</code>
     * @since 1.2
     */
    setCurve$java_awt_geom_CubicCurve2D(c: CubicCurve2D): void;
    /**
     * Returns the square of the flatness of the cubic curve specified by the
     * indicated control points. The flatness is the maximum distance of a
     * control point from the line connecting the end points.
     *
     * @param {number} x1
     * the X coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @return {number} the square of the flatness of the {@code CubicCurve2D}
     * represented by the specified coordinates.
     * @since 1.2
     */
    static getFlatnessSq$double$double$double$double$double$double$double$double(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): number;
    /**
     * Returns the square of the flatness of the cubic curve specified by the
     * indicated control points. The flatness is the maximum distance of a
     * control point from the line connecting the end points.
     *
     * @param {number} x1
     * the X coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @return {number} the square of the flatness of the {@code CubicCurve2D}
     * represented by the specified coordinates.
     * @since 1.2
     */
    static getFlatnessSq(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any): any;
    /**
     * Returns the flatness of the cubic curve specified by the indicated
     * control points. The flatness is the maximum distance of a control point
     * from the line connecting the end points.
     *
     * @param {number} x1
     * the X coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @return {number} the flatness of the {@code CubicCurve2D} represented by the
     * specified coordinates.
     * @since 1.2
     */
    static getFlatness$double$double$double$double$double$double$double$double(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): number;
    /**
     * Returns the flatness of the cubic curve specified by the indicated
     * control points. The flatness is the maximum distance of a control point
     * from the line connecting the end points.
     *
     * @param {number} x1
     * the X coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate that specifies the start point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate that specifies the first control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate that specifies the second control point of a
     * {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate that specifies the end point of a
     * {@code CubicCurve2D}
     * @return {number} the flatness of the {@code CubicCurve2D} represented by the
     * specified coordinates.
     * @since 1.2
     */
    static getFlatness(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any): any;
    /**
     * Returns the square of the flatness of the cubic curve specified by the
     * control points stored in the indicated array at the indicated index. The
     * flatness is the maximum distance of a control point from the line
     * connecting the end points.
     *
     * @param {Array} coords
     * an array containing coordinates
     * @param {number} offset
     * the index of <code>coords</code> from which to begin getting
     * the end points and control points of the curve
     * @return {number} the square of the flatness of the <code>CubicCurve2D</code>
     * specified by the coordinates in <code>coords</code> at the
     * specified offset.
     * @since 1.2
     */
    static getFlatnessSq$double_A$int(coords: number[], offset: number): number;
    /**
     * Returns the flatness of the cubic curve specified by the control points
     * stored in the indicated array at the indicated index. The flatness is the
     * maximum distance of a control point from the line connecting the end
     * points.
     *
     * @param {Array} coords
     * an array containing coordinates
     * @param {number} offset
     * the index of <code>coords</code> from which to begin getting
     * the end points and control points of the curve
     * @return {number} the flatness of the <code>CubicCurve2D</code> specified by the
     * coordinates in <code>coords</code> at the specified offset.
     * @since 1.2
     */
    static getFlatness$double_A$int(coords: number[], offset: number): number;
    /**
     * Returns the square of the flatness of this curve. The flatness is the
     * maximum distance of a control point from the line connecting the end
     * points.
     *
     * @return {number} the square of the flatness of this curve.
     * @since 1.2
     */
    getFlatnessSq(): number;
    /**
     * Returns the flatness of this curve. The flatness is the maximum distance
     * of a control point from the line connecting the end points.
     *
     * @return {number} the flatness of this curve.
     * @since 1.2
     */
    getFlatness(): number;
    /**
     * Subdivides this cubic curve and stores the resulting two subdivided
     * curves into the left and right curve parameters. Either or both of the
     * left and right objects may be the same as this object or null.
     *
     * @param {CubicCurve2D} left
     * the cubic curve object for storing for the left or first half
     * of the subdivided curve
     * @param {CubicCurve2D} right
     * the cubic curve object for storing for the right or second
     * half of the subdivided curve
     * @since 1.2
     */
    subdivide(left: CubicCurve2D, right: CubicCurve2D): void;
    /**
     * Subdivides the cubic curve specified by the <code>src</code> parameter
     * and stores the resulting two subdivided curves into the <code>left</code>
     * and <code>right</code> curve parameters. Either or both of the
     * <code>left</code> and <code>right</code> objects may be the same as the
     * <code>src</code> object or <code>null</code>.
     *
     * @param {CubicCurve2D} src
     * the cubic curve to be subdivided
     * @param {CubicCurve2D} left
     * the cubic curve object for storing the left or first half of
     * the subdivided curve
     * @param {CubicCurve2D} right
     * the cubic curve object for storing the right or second half of
     * the subdivided curve
     * @since 1.2
     */
    static subdivide$java_awt_geom_CubicCurve2D$java_awt_geom_CubicCurve2D$java_awt_geom_CubicCurve2D(src: CubicCurve2D, left: CubicCurve2D, right: CubicCurve2D): void;
    /**
     * Subdivides the cubic curve specified by the coordinates stored in the
     * <code>src</code> array at indices <code>srcoff</code> through (
     * <code>srcoff</code>&nbsp;+&nbsp;7) and stores the resulting two
     * subdivided curves into the two result arrays at the corresponding
     * indices. Either or both of the <code>left</code> and <code>right</code>
     * arrays may be <code>null</code> or a reference to the same array as the
     * <code>src</code> array. Note that the last point in the first subdivided
     * curve is the same as the first point in the second subdivided curve.
     * Thus, it is possible to pass the same array for <code>left</code> and
     * <code>right</code> and to use offsets, such as <code>rightoff</code>
     * equals (<code>leftoff</code> + 6), in order to avoid allocating extra
     * storage for this common point.
     *
     * @param {Array} src
     * the array holding the coordinates for the source curve
     * @param {number} srcoff
     * the offset into the array of the beginning of the the 6 source
     * coordinates
     * @param {Array} left
     * the array for storing the coordinates for the first half of
     * the subdivided curve
     * @param {number} leftoff
     * the offset into the array of the beginning of the the 6 left
     * coordinates
     * @param {Array} right
     * the array for storing the coordinates for the second half of
     * the subdivided curve
     * @param {number} rightoff
     * the offset into the array of the beginning of the the 6 right
     * coordinates
     * @since 1.2
     */
    static subdivide$double_A$int$double_A$int$double_A$int(src: number[], srcoff: number, left: number[], leftoff: number, right: number[], rightoff: number): void;
    /**
     * Subdivides the cubic curve specified by the coordinates stored in the
     * <code>src</code> array at indices <code>srcoff</code> through (
     * <code>srcoff</code>&nbsp;+&nbsp;7) and stores the resulting two
     * subdivided curves into the two result arrays at the corresponding
     * indices. Either or both of the <code>left</code> and <code>right</code>
     * arrays may be <code>null</code> or a reference to the same array as the
     * <code>src</code> array. Note that the last point in the first subdivided
     * curve is the same as the first point in the second subdivided curve.
     * Thus, it is possible to pass the same array for <code>left</code> and
     * <code>right</code> and to use offsets, such as <code>rightoff</code>
     * equals (<code>leftoff</code> + 6), in order to avoid allocating extra
     * storage for this common point.
     *
     * @param {Array} src
     * the array holding the coordinates for the source curve
     * @param {number} srcoff
     * the offset into the array of the beginning of the the 6 source
     * coordinates
     * @param {Array} left
     * the array for storing the coordinates for the first half of
     * the subdivided curve
     * @param {number} leftoff
     * the offset into the array of the beginning of the the 6 left
     * coordinates
     * @param {Array} right
     * the array for storing the coordinates for the second half of
     * the subdivided curve
     * @param {number} rightoff
     * the offset into the array of the beginning of the the 6 right
     * coordinates
     * @since 1.2
     */
    static subdivide(src?: any, srcoff?: any, left?: any, leftoff?: any, right?: any, rightoff?: any): any;
    /**
     * Solves the cubic whose coefficients are in the <code>eqn</code> array and
     * places the non-complex roots back into the same array, returning the
     * number of roots. The solved cubic is represented by the equation:
     *
     * <pre>
     * eqn = {c, b, a, d}
     * dx^3 + ax^2 + bx + c = 0
     * </pre>
     *
     * A return value of -1 is used to distinguish a constant equation that
     * might be always 0 or never 0 from an equation that has no zeroes.
     *
     * @param {Array} eqn
     * an array containing coefficients for a cubic
     * @return {number} the number of roots, or -1 if the equation is a constant.
     * @since 1.2
     */
    static solveCubic$double_A(eqn: number[]): number;
    /**
     * Solve the cubic whose coefficients are in the <code>eqn</code> array and
     * place the non-complex roots into the <code>res</code> array, returning
     * the number of roots. The cubic solved is represented by the equation: eqn
     * = {c, b, a, d} dx^3 + ax^2 + bx + c = 0 A return value of -1 is used to
     * distinguish a constant equation, which may be always 0 or never 0, from
     * an equation which has no zeroes.
     *
     * @param {Array} eqn
     * the specified array of coefficients to use to solve the cubic
     * equation
     * @param {Array} res
     * the array that contains the non-complex roots resulting from
     * the solution of the cubic equation
     * @return {number} the number of roots, or -1 if the equation is a constant
     * @since 1.3
     */
    static solveCubic$double_A$double_A(eqn: number[], res: number[]): number;
    /**
     * Solve the cubic whose coefficients are in the <code>eqn</code> array and
     * place the non-complex roots into the <code>res</code> array, returning
     * the number of roots. The cubic solved is represented by the equation: eqn
     * = {c, b, a, d} dx^3 + ax^2 + bx + c = 0 A return value of -1 is used to
     * distinguish a constant equation, which may be always 0 or never 0, from
     * an equation which has no zeroes.
     *
     * @param {Array} eqn
     * the specified array of coefficients to use to solve the cubic
     * equation
     * @param {Array} res
     * the array that contains the non-complex roots resulting from
     * the solution of the cubic equation
     * @return {number} the number of roots, or -1 if the equation is a constant
     * @since 1.3
     */
    static solveCubic(eqn?: any, res?: any): any;
    static fixRoots(eqn: number[], res: number[], num: number): number;
    static refineRootWithHint(eqn: number[], min: number, max: number, t: number): number;
    static bisectRootWithHint(eqn: number[], x0: number, xe: number, hint: number): number;
    static bisectRoot(eqn: number[], x0: number, xe: number): number;
    static inInterval(t: number, min: number, max: number): boolean;
    static within(x: number, y: number, err: number): boolean;
    static iszero(x: number, err: number): boolean;
    static oppositeSigns(x1: number, x2: number): boolean;
    static solveEqn(eqn: number[], order: number, t: number): number;
    static getRootUpperBound(eqn: number[]): number;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Point2D} p
     * @return {boolean}
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains(x?: any, y?: any, w?: any, h?: any): any;
    rectCrossings(x: number, y: number, w: number, h: number): number;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Returns an iteration object that defines the boundary of the shape. The
     * iterator for this class is not multi-threaded safe, which means that this
     * <code>CubicCurve2D</code> class does not guarantee that modifications to
     * the geometry of this <code>CubicCurve2D</code> object do not affect any
     * iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>CubicCurve2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Return an iteration object that defines the boundary of the flattened
     * shape. The iterator for this class is not multi-threaded safe, which
     * means that this <code>CubicCurve2D</code> class does not guarantee that
     * modifications to the geometry of this <code>CubicCurve2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>CubicCurve2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Return an iteration object that defines the boundary of the flattened
     * shape. The iterator for this class is not multi-threaded safe, which
     * means that this <code>CubicCurve2D</code> class does not guarantee that
     * modifications to the geometry of this <code>CubicCurve2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>CubicCurve2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Creates a new object of the same class as this object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
}
declare namespace CubicCurve2D {
    /**
     * Constructs and initializes a {@code CubicCurve2D} from the specified
     * {@code float} coordinates.
     *
     * @param {number} x1
     * the X coordinate for the start point of the resulting
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate for the start point of the resulting
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate for the first control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate for the first control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate for the second control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate for the second control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate for the end point of the resulting
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate for the end point of the resulting
     * {@code CubicCurve2D}
     * @since 1.2
     * @class
     */
    class Float extends CubicCurve2D {
        /**
         * The X coordinate of the start point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the first control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx1: number;
        /**
         * The Y coordinate of the first control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly1: number;
        /**
         * The X coordinate of the second control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx2: number;
        /**
         * The Y coordinate of the second control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly2: number;
        /**
         * The X coordinate of the end point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlP2(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} ctrlx1
         * @param {number} ctrly1
         * @param {number} ctrlx2
         * @param {number} ctrly2
         * @param {number} x2
         * @param {number} y2
         */
        setCurve$double$double$double$double$double$double$double$double(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points and control points of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} y1
         * the Y coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} ctrlx1
         * the X coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly1
         * the Y coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrlx2
         * the X coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly2
         * the Y coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} x2
         * the X coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @param {number} y2
         * the Y coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @since 1.2
         */
        setCurve$float$float$float$float$float$float$float$float(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points and control points of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} y1
         * the Y coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} ctrlx1
         * the X coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly1
         * the Y coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrlx2
         * the X coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly2
         * the Y coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} x2
         * the X coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @param {number} y2
         * the Y coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @since 1.2
         */
        setCurve(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a {@code CubicCurve2D} from the specified
     * {@code double} coordinates.
     *
     * @param {number} x1
     * the X coordinate for the start point of the resulting
     * {@code CubicCurve2D}
     * @param {number} y1
     * the Y coordinate for the start point of the resulting
     * {@code CubicCurve2D}
     * @param {number} ctrlx1
     * the X coordinate for the first control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrly1
     * the Y coordinate for the first control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrlx2
     * the X coordinate for the second control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} ctrly2
     * the Y coordinate for the second control point of the
     * resulting {@code CubicCurve2D}
     * @param {number} x2
     * the X coordinate for the end point of the resulting
     * {@code CubicCurve2D}
     * @param {number} y2
     * the Y coordinate for the end point of the resulting
     * {@code CubicCurve2D}
     * @since 1.2
     * @class
     */
    class Double extends CubicCurve2D {
        /**
         * The X coordinate of the start point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the first control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx1: number;
        /**
         * The Y coordinate of the first control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly1: number;
        /**
         * The X coordinate of the second control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx2: number;
        /**
         * The Y coordinate of the second control point of the cubic curve
         * segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly2: number;
        /**
         * The X coordinate of the end point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the cubic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlP2(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * Sets the location of the end points and control points of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} y1
         * the Y coordinate used to set the start point of this
         * {@code CubicCurve2D}
         * @param {number} ctrlx1
         * the X coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly1
         * the Y coordinate used to set the first control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrlx2
         * the X coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} ctrly2
         * the Y coordinate used to set the second control point of
         * this {@code CubicCurve2D}
         * @param {number} x2
         * the X coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @param {number} y2
         * the Y coordinate used to set the end point of this
         * {@code CubicCurve2D}
         * @since 1.2
         */
        setCurve(x1?: any, y1?: any, ctrlx1?: any, ctrly1?: any, ctrlx2?: any, ctrly2?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} ctrlx1
         * @param {number} ctrly1
         * @param {number} ctrlx2
         * @param {number} ctrly2
         * @param {number} x2
         * @param {number} y2
         */
        setCurve$double$double$double$double$double$double$double$double(x1: number, y1: number, ctrlx1: number, ctrly1: number, ctrlx2: number, ctrly2: number, x2: number, y2: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
}
/**
 * A utility class to iterate over the path segments of a cubic curve segment
 * through the PathIterator interface.
 *
 * @author Jim Graham
 */
declare class CubicIterator implements PathIterator {
    cubic: CubicCurve2D;
    affine: AffineTransform;
    index: number;
    constructor(q: CubicCurve2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next(): void;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.Dimension
 * @since 1.2
 * @class
 */
declare abstract class Dimension2D {
    constructor();
    /**
     * Returns the width of this <code>Dimension</code> in double precision.
     *
     * @return {number} the width of this <code>Dimension</code>.
     * @since 1.2
     */
    abstract getWidth(): number;
    /**
     * Returns the height of this <code>Dimension</code> in double precision.
     *
     * @return {number} the height of this <code>Dimension</code>.
     * @since 1.2
     */
    abstract getHeight(): number;
    /**
     * Sets the size of this <code>Dimension</code> object to the specified
     * width and height. This method is included for completeness, to parallel
     * the {@link java.awt.Component#getSize} method of
     * {@link java.awt.Component}.
     *
     * @param {number} width
     * the new width for the <code>Dimension</code> object
     * @param {number} height
     * the new height for the <code>Dimension</code> object
     * @since 1.2
     */
    setSize$double$double(width: number, height: number): void;
    /**
     * Sets the size of this <code>Dimension</code> object to the specified
     * width and height. This method is included for completeness, to parallel
     * the {@link java.awt.Component#getSize} method of
     * {@link java.awt.Component}.
     *
     * @param {number} width
     * the new width for the <code>Dimension</code> object
     * @param {number} height
     * the new height for the <code>Dimension</code> object
     * @since 1.2
     */
    setSize(width?: any, height?: any): any;
    /**
     * Sets the size of this <code>Dimension2D</code> object to match the
     * specified size. This method is included for completeness, to parallel the
     * <code>getSize</code> method of <code>Component</code>.
     *
     * @param {Dimension2D} d
     * the new size for the <code>Dimension2D</code> object
     * @since 1.2
     */
    setSize$java_awt_geom_Dimension2D(d: Dimension2D): void;
    /**
     * Creates a new object of the same class as this object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
}
/**
 * A utility class to iterate over the path segments of an ellipse through the
 * PathIterator interface.
 *
 * @author Jim Graham
 */
declare class EllipseIterator implements PathIterator {
    x: number;
    y: number;
    w: number;
    h: number;
    affine: AffineTransform;
    index: number;
    constructor(e: Ellipse2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next(): void;
    static CtrlVal: number;
    static pcv: number;
    static pcv_$LI$(): number;
    static ncv: number;
    static ncv_$LI$(): number;
    static ctrlpts: number[][];
    static ctrlpts_$LI$(): number[][];
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * Constructs a new <code>FlatteningPathIterator</code> object that flattens
 * a path as it iterates over it. The <code>limit</code> parameter allows
 * you to control the maximum number of recursive subdivisions that the
 * iterator can make before it assumes that the curve is flat enough without
 * measuring against the <code>flatness</code> parameter. The flattened
 * iteration therefore never generates more than a maximum of
 * <code>(2^limit)</code> line segments per curve.
 *
 * @param {PathIterator} src
 * the original unflattened path being iterated over
 * @param {number} flatness
 * the maximum allowable distance between the control points and
 * the flattened curve
 * @param {number} limit
 * the maximum number of recursive subdivisions allowed for any
 * curved segment
 * @exception IllegalArgumentException
 * if <code>flatness</code> or <code>limit</code> is less
 * than zero
 * @class
 */
declare class FlatteningPathIterator implements PathIterator {
    static GROW_SIZE: number;
    src: PathIterator;
    squareflat: number;
    limit: number;
    hold: number[];
    curx: number;
    cury: number;
    movx: number;
    movy: number;
    holdType: number;
    holdEnd: number;
    holdIndex: number;
    levels: number[];
    levelIndex: number;
    done: boolean;
    constructor(src?: any, flatness?: any, limit?: any);
    /**
     * Returns the flatness of this iterator.
     *
     * @return {number} the flatness of this <code>FlatteningPathIterator</code>.
     */
    getFlatness(): number;
    /**
     * Returns the recursion limit of this iterator.
     *
     * @return {number} the recursion limit of this <code>FlatteningPathIterator</code>.
     */
    getRecursionLimit(): number;
    /**
     * Returns the winding rule for determining the interior of the path.
     *
     * @return {number} the winding rule of the original unflattened path being iterated
     * over.
     * @see PathIterator#WIND_EVEN_ODD
     * @see PathIterator#WIND_NON_ZERO
     */
    getWindingRule(): number;
    /**
     * Tests if the iteration is complete.
     *
     * @return {boolean} <code>true</code> if all the segments have been read;
     * <code>false</code> otherwise.
     */
    isDone(): boolean;
    ensureHoldCapacity(want: number): void;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next$(): void;
    next$boolean(doNext: boolean): void;
    next(doNext?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, or SEG_CLOSE. A float array of length 6 must be passed in and
     * can be used to store the coordinates of the point(s). Each point is
     * stored as a pair of float x,y coordinates. SEG_MOVETO and SEG_LINETO
     * types return one point, and SEG_CLOSE does not return any points.
     *
     * @param {Array} coords
     * an array that holds the data returned from this method
     * @return {number} the path segment type of the current path segment.
     * @exception NoSuchElementException
     * if there are no more elements in the flattening path to be
     * returned.
     * @see PathIterator#SEG_MOVETO
     * @see PathIterator#SEG_LINETO
     * @see PathIterator#SEG_CLOSE
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, or SEG_CLOSE. A float array of length 6 must be passed in and
     * can be used to store the coordinates of the point(s). Each point is
     * stored as a pair of float x,y coordinates. SEG_MOVETO and SEG_LINETO
     * types return one point, and SEG_CLOSE does not return any points.
     *
     * @param {Array} coords
     * an array that holds the data returned from this method
     * @return {number} the path segment type of the current path segment.
     * @exception NoSuchElementException
     * if there are no more elements in the flattening path to be
     * returned.
     * @see PathIterator#SEG_MOVETO
     * @see PathIterator#SEG_LINETO
     * @see PathIterator#SEG_CLOSE
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, or SEG_CLOSE. A double array of length 6 must be passed in
     * and can be used to store the coordinates of the point(s). Each point is
     * stored as a pair of double x,y coordinates. SEG_MOVETO and SEG_LINETO
     * types return one point, and SEG_CLOSE does not return any points.
     *
     * @param {Array} coords
     * an array that holds the data returned from this method
     * @return {number} the path segment type of the current path segment.
     * @exception NoSuchElementException
     * if there are no more elements in the flattening path to be
     * returned.
     * @see PathIterator#SEG_MOVETO
     * @see PathIterator#SEG_LINETO
     * @see PathIterator#SEG_CLOSE
     */
    currentSegment$double_A(coords: number[]): number;
}
declare class Helper {
    static ARRAY_PROCESS_BATCH_SIZE: number;
    static unsafeClone(array: any, fromIndex: number, toIndex: number): any[];
    static arraycopy(src: any, srcOfs: number, dest: any, destOfs: number, len: number): void;
    private static applySplice(arrayObject, index, deleteCount, arrayToAdd);
}
/**
 * Constructs an <code>IllegalPathStateException</code> with the
 * specified detail message.
 * @param   {string} s   the detail message
 * @since   1.2
 * @class
 */
declare class IllegalPathStateException extends Error {
    constructor(s?: any);
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessory methods below.
 *
 * @see java.awt.geom.Line2D.Float
 * @see java.awt.geom.Line2D.Double
 * @since 1.2
 * @class
 */
declare abstract class Line2D implements java.awt.Shape {
    abstract getBounds2D(): any;
    constructor();
    /**
     * Returns the X coordinate of the start point in double precision.
     *
     * @return {number} the X coordinate of the start point of this {@code Line2D}
     * object.
     * @since 1.2
     */
    abstract getX1(): number;
    /**
     * Returns the Y coordinate of the start point in double precision.
     *
     * @return {number} the Y coordinate of the start point of this {@code Line2D}
     * object.
     * @since 1.2
     */
    abstract getY1(): number;
    /**
     * Returns the start <code>Point2D</code> of this <code>Line2D</code>.
     *
     * @return {Point2D} the start <code>Point2D</code> of this <code>Line2D</code>.
     * @since 1.2
     */
    abstract getP1(): Point2D;
    /**
     * Returns the X coordinate of the end point in double precision.
     *
     * @return {number} the X coordinate of the end point of this {@code Line2D} object.
     * @since 1.2
     */
    abstract getX2(): number;
    /**
     * Returns the Y coordinate of the end point in double precision.
     *
     * @return {number} the Y coordinate of the end point of this {@code Line2D} object.
     * @since 1.2
     */
    abstract getY2(): number;
    /**
     * Returns the end <code>Point2D</code> of this <code>Line2D</code>.
     *
     * @return {Point2D} the end <code>Point2D</code> of this <code>Line2D</code>.
     * @since 1.2
     */
    abstract getP2(): Point2D;
    /**
     * Sets the location of the end points of this <code>Line2D</code> to
     * the specified float coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     */
    setLine(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Sets the location of the end points of this <code>Line2D</code> to the
     * specified double coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     */
    setLine$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Sets the location of the end points of this <code>Line2D</code> to the
     * specified <code>Point2D</code> coordinates.
     *
     * @param {Point2D} p1
     * the start <code>Point2D</code> of the line segment
     * @param {Point2D} p2
     * the end <code>Point2D</code> of the line segment
     * @since 1.2
     */
    setLine$java_awt_geom_Point2D$java_awt_geom_Point2D(p1: Point2D, p2: Point2D): void;
    /**
     * Sets the location of the end points of this <code>Line2D</code> to the
     * same as those end points of the specified <code>Line2D</code>.
     *
     * @param {Line2D} l
     * the specified <code>Line2D</code>
     * @since 1.2
     */
    setLine$java_awt_geom_Line2D(l: Line2D): void;
    /**
     * Returns an indicator of where the specified point {@code (px,py)} lies
     * with respect to the line segment from {@code (x1,y1)} to {@code (x2,y2)}.
     * The return value can be either 1, -1, or 0 and indicates in which
     * direction the specified line must pivot around its first end point,
     * {@code (x1,y1)}, in order to point at the specified point {@code (px,py)}
     * .
     * <p>
     * A return value of 1 indicates that the line segment must turn in the
     * direction that takes the positive X axis towards the negative Y axis. In
     * the default coordinate system used by Java 2D, this direction is
     * counterclockwise.
     * <p>
     * A return value of -1 indicates that the line segment must turn in the
     * direction that takes the positive X axis towards the positive Y axis. In
     * the default coordinate system, this direction is clockwise.
     * <p>
     * A return value of 0 indicates that the point lies exactly on the line
     * segment. Note that an indicator value of 0 is rare and not useful for
     * determining collinearity because of floating point rounding issues.
     * <p>
     * If the point is colinear with the line segment, but not between the end
     * points, then the value will be -1 if the point lies
     * "beyond {@code (x1,y1)}" or 1 if the point lies "beyond {@code (x2,y2)}".
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @param {number} px
     * the X coordinate of the specified point to be compared with
     * the specified line segment
     * @param {number} py
     * the Y coordinate of the specified point to be compared with
     * the specified line segment
     * @return {number} an integer that indicates the position of the third specified
     * coordinates with respect to the line segment formed by the first
     * two specified coordinates.
     * @since 1.2
     */
    static relativeCCW(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number;
    /**
     * Returns an indicator of where the specified point {@code (px,py)} lies
     * with respect to this line segment. See the method comments of
     * {@link #relativeCCW(double, double, double, double, double, double)} to
     * interpret the return value.
     *
     * @param {number} px
     * the X coordinate of the specified point to be compared with
     * this <code>Line2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be compared with
     * this <code>Line2D</code>
     * @return {number} an integer that indicates the position of the specified
     * coordinates with respect to this <code>Line2D</code>
     * @see #relativeCCW(double, double, double, double, double, double)
     * @since 1.2
     */
    relativeCCW$double$double(px: number, py: number): number;
    /**
     * Returns an indicator of where the specified point {@code (px,py)} lies
     * with respect to this line segment. See the method comments of
     * {@link #relativeCCW(double, double, double, double, double, double)} to
     * interpret the return value.
     *
     * @param {number} px
     * the X coordinate of the specified point to be compared with
     * this <code>Line2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be compared with
     * this <code>Line2D</code>
     * @return {number} an integer that indicates the position of the specified
     * coordinates with respect to this <code>Line2D</code>
     * @see #relativeCCW(double, double, double, double, double, double)
     * @since 1.2
     */
    relativeCCW(px?: any, py?: any): any;
    /**
     * Returns an indicator of where the specified <code>Point2D</code> lies
     * with respect to this line segment. See the method comments of
     * {@link #relativeCCW(double, double, double, double, double, double)} to
     * interpret the return value.
     *
     * @param {Point2D} p
     * the specified <code>Point2D</code> to be compared with this
     * <code>Line2D</code>
     * @return {number} an integer that indicates the position of the specified
     * <code>Point2D</code> with respect to this <code>Line2D</code>
     * @see #relativeCCW(double, double, double, double, double, double)
     * @since 1.2
     */
    relativeCCW$java_awt_geom_Point2D(p: Point2D): number;
    /**
     * Tests if the line segment from {@code (x1,y1)} to {@code (x2,y2)}
     * intersects the line segment from {@code (x3,y3)} to {@code (x4,y4)}.
     *
     * @param {number} x1
     * the X coordinate of the start point of the first specified
     * line segment
     * @param {number} y1
     * the Y coordinate of the start point of the first specified
     * line segment
     * @param {number} x2
     * the X coordinate of the end point of the first specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the first specified line
     * segment
     * @param {number} x3
     * the X coordinate of the start point of the second specified
     * line segment
     * @param {number} y3
     * the Y coordinate of the start point of the second specified
     * line segment
     * @param {number} x4
     * the X coordinate of the end point of the second specified line
     * segment
     * @param {number} y4
     * the Y coordinate of the end point of the second specified line
     * segment
     * @return {boolean} <code>true</code> if the first specified line segment and the
     * second specified line segment intersect each other;
     * <code>false</code> otherwise.
     * @since 1.2
     */
    static linesIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean;
    /**
     * Tests if the line segment from {@code (x1,y1)} to {@code (x2,y2)}
     * intersects this line segment.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @return {boolean} {@code <true>} if this line segment and the specified line
     * segment intersect each other; <code>false</code> otherwise.
     * @since 1.2
     */
    intersectsLine$double$double$double$double(x1: number, y1: number, x2: number, y2: number): boolean;
    /**
     * Tests if the line segment from {@code (x1,y1)} to {@code (x2,y2)}
     * intersects this line segment.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @return {boolean} {@code <true>} if this line segment and the specified line
     * segment intersect each other; <code>false</code> otherwise.
     * @since 1.2
     */
    intersectsLine(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Tests if the specified line segment intersects this line segment.
     *
     * @param {Line2D} l
     * the specified <code>Line2D</code>
     * @return {boolean} <code>true</code> if this line segment and the specified line
     * segment intersect each other; <code>false</code> otherwise.
     * @since 1.2
     */
    intersectsLine$java_awt_geom_Line2D(l: Line2D): boolean;
    /**
     * Returns the square of the distance from a point to a line segment. The
     * distance measured is the distance between the specified point and the
     * closest point between the specified end points. If the specified point
     * intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * the specified line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * the specified line segment
     * @return {number} a double value that is the square of the distance from the
     * specified point to the specified line segment.
     * @see #ptLineDistSq(double, double, double, double, double, double)
     * @since 1.2
     */
    static ptSegDistSq(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number;
    /**
     * Returns the distance from a point to a line segment. The distance
     * measured is the distance between the specified point and the closest
     * point between the specified end points. If the specified point intersects
     * the line segment in between the end points, this method returns 0.0.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * the specified line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * the specified line segment
     * @return {number} a double value that is the distance from the specified point to
     * the specified line segment.
     * @see #ptLineDist(double, double, double, double, double, double)
     * @since 1.2
     */
    static ptSegDist(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number;
    /**
     * Returns the square of the distance from a point to this line segment. The
     * distance measured is the distance between the specified point and the
     * closest point between the current line's end points. If the specified
     * point intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line segment
     * @return {number} a double value that is the square of the distance from the
     * specified point to the current line segment.
     * @see #ptLineDistSq(double, double)
     * @since 1.2
     */
    ptSegDistSq$double$double(px: number, py: number): number;
    /**
     * Returns the square of the distance from a point to this line segment. The
     * distance measured is the distance between the specified point and the
     * closest point between the current line's end points. If the specified
     * point intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line segment
     * @return {number} a double value that is the square of the distance from the
     * specified point to the current line segment.
     * @see #ptLineDistSq(double, double)
     * @since 1.2
     */
    ptSegDistSq(px?: any, py?: any): any;
    /**
     * Returns the square of the distance from a <code>Point2D</code> to this
     * line segment. The distance measured is the distance between the specified
     * point and the closest point between the current line's end points. If the
     * specified point intersects the line segment in between the end points,
     * this method returns 0.0.
     *
     * @param {Point2D} pt
     * the specified <code>Point2D</code> being measured against this
     * line segment.
     * @return {number} a double value that is the square of the distance from the
     * specified <code>Point2D</code> to the current line segment.
     * @see #ptLineDistSq(Point2D)
     * @since 1.2
     */
    ptSegDistSq$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Returns the distance from a point to this line segment. The distance
     * measured is the distance between the specified point and the closest
     * point between the current line's end points. If the specified point
     * intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line segment
     * @return {number} a double value that is the distance from the specified point to
     * the current line segment.
     * @see #ptLineDist(double, double)
     * @since 1.2
     */
    ptSegDist$double$double(px: number, py: number): number;
    /**
     * Returns the distance from a point to this line segment. The distance
     * measured is the distance between the specified point and the closest
     * point between the current line's end points. If the specified point
     * intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line segment
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line segment
     * @return {number} a double value that is the distance from the specified point to
     * the current line segment.
     * @see #ptLineDist(double, double)
     * @since 1.2
     */
    ptSegDist(px?: any, py?: any): any;
    /**
     * Returns the distance from a <code>Point2D</code> to this line segment.
     * The distance measured is the distance between the specified point and the
     * closest point between the current line's end points. If the specified
     * point intersects the line segment in between the end points, this method
     * returns 0.0.
     *
     * @param {Point2D} pt
     * the specified <code>Point2D</code> being measured against this
     * line segment
     * @return {number} a double value that is the distance from the specified
     * <code>Point2D</code> to the current line segment.
     * @see #ptLineDist(Point2D)
     * @since 1.2
     */
    ptSegDist$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Returns the square of the distance from a point to a line. The distance
     * measured is the distance between the specified point and the closest
     * point on the infinitely-extended line defined by the specified
     * coordinates. If the specified point intersects the line, this method
     * returns 0.0.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * the specified line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * the specified line
     * @return {number} a double value that is the square of the distance from the
     * specified point to the specified line.
     * @see #ptSegDistSq(double, double, double, double, double, double)
     * @since 1.2
     */
    static ptLineDistSq(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number;
    /**
     * Returns the distance from a point to a line. The distance measured is the
     * distance between the specified point and the closest point on the
     * infinitely-extended line defined by the specified coordinates. If the
     * specified point intersects the line, this method returns 0.0.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * the specified line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * the specified line
     * @return {number} a double value that is the distance from the specified point to
     * the specified line.
     * @see #ptSegDist(double, double, double, double, double, double)
     * @since 1.2
     */
    static ptLineDist(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number;
    /**
     * Returns the square of the distance from a point to this line. The
     * distance measured is the distance between the specified point and the
     * closest point on the infinitely-extended line defined by this
     * <code>Line2D</code>. If the specified point intersects the line, this
     * method returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line
     * @return {number} a double value that is the square of the distance from a
     * specified point to the current line.
     * @see #ptSegDistSq(double, double)
     * @since 1.2
     */
    ptLineDistSq$double$double(px: number, py: number): number;
    /**
     * Returns the square of the distance from a point to this line. The
     * distance measured is the distance between the specified point and the
     * closest point on the infinitely-extended line defined by this
     * <code>Line2D</code>. If the specified point intersects the line, this
     * method returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line
     * @return {number} a double value that is the square of the distance from a
     * specified point to the current line.
     * @see #ptSegDistSq(double, double)
     * @since 1.2
     */
    ptLineDistSq(px?: any, py?: any): any;
    /**
     * Returns the square of the distance from a specified <code>Point2D</code>
     * to this line. The distance measured is the distance between the specified
     * point and the closest point on the infinitely-extended line defined by
     * this <code>Line2D</code>. If the specified point intersects the line,
     * this method returns 0.0.
     *
     * @param {Point2D} pt
     * the specified <code>Point2D</code> being measured against this
     * line
     * @return {number} a double value that is the square of the distance from a
     * specified <code>Point2D</code> to the current line.
     * @see #ptSegDistSq(Point2D)
     * @since 1.2
     */
    ptLineDistSq$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Returns the distance from a point to this line. The distance measured is
     * the distance between the specified point and the closest point on the
     * infinitely-extended line defined by this <code>Line2D</code>. If the
     * specified point intersects the line, this method returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line
     * @return {number} a double value that is the distance from a specified point to the
     * current line.
     * @see #ptSegDist(double, double)
     * @since 1.2
     */
    ptLineDist$double$double(px: number, py: number): number;
    /**
     * Returns the distance from a point to this line. The distance measured is
     * the distance between the specified point and the closest point on the
     * infinitely-extended line defined by this <code>Line2D</code>. If the
     * specified point intersects the line, this method returns 0.0.
     *
     * @param {number} px
     * the X coordinate of the specified point being measured against
     * this line
     * @param {number} py
     * the Y coordinate of the specified point being measured against
     * this line
     * @return {number} a double value that is the distance from a specified point to the
     * current line.
     * @see #ptSegDist(double, double)
     * @since 1.2
     */
    ptLineDist(px?: any, py?: any): any;
    /**
     * Returns the distance from a <code>Point2D</code> to this line. The
     * distance measured is the distance between the specified point and the
     * closest point on the infinitely-extended line defined by this
     * <code>Line2D</code>. If the specified point intersects the line, this
     * method returns 0.0.
     *
     * @param {Point2D} pt
     * the specified <code>Point2D</code> being measured
     * @return {number} a double value that is the distance from a specified
     * <code>Point2D</code> to the current line.
     * @see #ptSegDist(Point2D)
     * @since 1.2
     */
    ptLineDist$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Tests if a specified coordinate is inside the boundary of this
     * <code>Line2D</code>. This method is required to implement the
     * {@link Shape} interface, but in the case of <code>Line2D</code> objects
     * it always returns <code>false</code> since a line contains no area.
     *
     * @param {number} x
     * the X coordinate of the specified point to be tested
     * @param {number} y
     * the Y coordinate of the specified point to be tested
     * @return {boolean} <code>false</code> because a <code>Line2D</code> contains no
     * area.
     * @since 1.2
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * Tests if a given <code>Point2D</code> is inside the boundary of this
     * <code>Line2D</code>. This method is required to implement the
     * {@link Shape} interface, but in the case of <code>Line2D</code> objects
     * it always returns <code>false</code> since a line contains no area.
     *
     * @param {Point2D} p
     * the specified <code>Point2D</code> to be tested
     * @return {boolean} <code>false</code> because a <code>Line2D</code> contains no
     * area.
     * @since 1.2
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Tests if the interior of this <code>Line2D</code> entirely contains the
     * specified set of rectangular coordinates. This method is required to
     * implement the <code>Shape</code> interface, but in the case of
     * <code>Line2D</code> objects it always returns false since a line contains
     * no area.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the specified
     * rectangular area
     * @param {number} y
     * the Y coordinate of the upper-left corner of the specified
     * rectangular area
     * @param {number} w
     * the width of the specified rectangular area
     * @param {number} h
     * the height of the specified rectangular area
     * @return {boolean} <code>false</code> because a <code>Line2D</code> contains no
     * area.
     * @since 1.2
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * Tests if the interior of this <code>Line2D</code> entirely contains the
     * specified set of rectangular coordinates. This method is required to
     * implement the <code>Shape</code> interface, but in the case of
     * <code>Line2D</code> objects it always returns false since a line contains
     * no area.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the specified
     * rectangular area
     * @param {number} y
     * the Y coordinate of the upper-left corner of the specified
     * rectangular area
     * @param {number} w
     * the width of the specified rectangular area
     * @param {number} h
     * the height of the specified rectangular area
     * @return {boolean} <code>false</code> because a <code>Line2D</code> contains no
     * area.
     * @since 1.2
     */
    contains(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Tests if the interior of this <code>Line2D</code> entirely contains the
     * specified <code>Rectangle2D</code>. This method is required to implement
     * the <code>Shape</code> interface, but in the case of <code>Line2D</code>
     * objects it always returns <code>false</code> since a line contains no
     * area.
     *
     * @param {Rectangle2D} r
     * the specified <code>Rectangle2D</code> to be tested
     * @return {boolean} <code>false</code> because a <code>Line2D</code> contains no
     * area.
     * @since 1.2
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Returns an iteration object that defines the boundary of this
     * <code>Line2D</code>. The iterator for this class is not multi-threaded
     * safe, which means that this <code>Line2D</code> class does not guarantee
     * that modifications to the geometry of this <code>Line2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * the specified {@link AffineTransform}
     * @return {PathIterator} a {@link PathIterator} that defines the boundary of this
     * <code>Line2D</code>.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of this flattened
     * <code>Line2D</code>. The iterator for this class is not multi-threaded
     * safe, which means that this <code>Line2D</code> class does not guarantee
     * that modifications to the geometry of this <code>Line2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * the specified <code>AffineTransform</code>
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points. Since a
     * <code>Line2D</code> object is always flat, this parameter is
     * ignored.
     * @return {PathIterator} a <code>PathIterator</code> that defines the boundary of the
     * flattened <code>Line2D</code>
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of this flattened
     * <code>Line2D</code>. The iterator for this class is not multi-threaded
     * safe, which means that this <code>Line2D</code> class does not guarantee
     * that modifications to the geometry of this <code>Line2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * the specified <code>AffineTransform</code>
     * @param {number} flatness
     * the maximum amount that the control points for a given curve
     * can vary from colinear before a subdivided curve is replaced
     * by a straight line connecting the end points. Since a
     * <code>Line2D</code> object is always flat, this parameter is
     * ignored.
     * @return {PathIterator} a <code>PathIterator</code> that defines the boundary of the
     * flattened <code>Line2D</code>
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Creates a new object of the same class as this object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
}
declare namespace Line2D {
    /**
     * Constructs and initializes a Line from the specified coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     * @class
     */
    class Float extends Line2D {
        /**
         * The X coordinate of the start point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the end point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        setLine$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points of this <code>Line2D</code> to
         * the specified float coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setLine$float$float$float$float(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points of this <code>Line2D</code> to
         * the specified float coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setLine(x1?: any, y1?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a <code>Line2D</code> from the specified
     * coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     * @class
     */
    class Double extends Line2D {
        /**
         * The X coordinate of the start point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the end point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the line segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * Sets the location of the end points of this <code>Line2D</code> to
         * the specified float coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setLine(x1?: any, y1?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        setLine$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
}
/**
 * A utility class to iterate over the path segments of a line segment through
 * the PathIterator interface.
 *
 * @author Jim Graham
 */
declare class LineIterator implements PathIterator {
    line: Line2D;
    affine: AffineTransform;
    index: number;
    constructor(l: Line2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    next(doNext?: any): any;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next$(): void;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * Constructs an instance of <code>NoninvertibleTransformException</code>
 * with the specified detail message.
 *
 * @param {string} s
 * the detail message
 * @since 1.2
 * @class
 */
declare class NoninvertibleTransformException extends Error {
    constructor(s: string);
}
/**
 * The <code>PathIterator</code> interface provides the mechanism for objects
 * that implement the {@link java.awt.Shape} interface to return the
 * geometry of their boundary by allowing a caller to retrieve the path of that
 * boundary a segment at a time. This interface allows these objects to retrieve
 * the path of their boundary a segment at a time by using 1st through 3rd order
 * B&eacute;zier curves, which are lines and quadratic or cubic B&eacute;zier
 * splines.
 * <p>
 * Multiple subpaths can be expressed by using a "MOVETO" segment to create a
 * discontinuity in the geometry to move from the end of one subpath to the
 * beginning of the next.
 * <p>
 * Each subpath can be closed manually by ending the last segment in the subpath
 * on the same coordinate as the beginning "MOVETO" segment for that subpath or
 * by using a "CLOSE" segment to append a line segment from the last point back
 * to the first. Be aware that manually closing an outline as opposed to using a
 * "CLOSE" segment to close the path might result in different line style
 * decorations being used at the end points of the subpath. For example, the
 * {@link java.awt.BasicStroke} object uses a line "JOIN" decoration
 * to connect the first and last points if a "CLOSE" segment is encountered,
 * whereas simply ending the path on the same coordinate as the beginning
 * coordinate results in line "CAP" decorations being used at the ends.
 *
 * @see java.awt.Shape
 * @see java.awt.BasicStroke
 *
 * @author Jim Graham
 */
interface PathIterator {
    /**
     * Returns the winding rule for determining the interior of the path.
     *
     * @return {number} the winding rule.
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     */
    getWindingRule(): number;
    /**
     * Tests if the iteration is complete.
     *
     * @return {boolean} <code>true</code> if all the segments have been read;
     * <code>false</code> otherwise.
     */
    isDone(): boolean;
    next(doNext?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path-segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and can be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types returns one point, SEG_QUADTO returns two
     * points, SEG_CUBICTO returns 3 points and SEG_CLOSE does not return any
     * points.
     *
     * @param {Array} coords
     * an array that holds the data returned from this method
     * @return {number} the path-segment type of the current path segment.
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     */
    currentSegment(coords?: any): any;
}
declare namespace PathIterator {
    /**
     * The winding rule constant for specifying an even-odd rule for determining
     * the interior of a path. The even-odd rule specifies that a point lies
     * inside the path if a ray drawn in any direction from that point to
     * infinity is crossed by path segments an odd number of times.
     */
    let WIND_EVEN_ODD: number;
    /**
     * The winding rule constant for specifying a non-zero rule for determining
     * the interior of a path. The non-zero rule specifies that a point lies
     * inside the path if a ray drawn in any direction from that point to
     * infinity is crossed by path segments a different number of times in the
     * counter-clockwise direction than the clockwise direction.
     */
    let WIND_NON_ZERO: number;
    /**
     * The segment type constant for a point that specifies the starting
     * location for a new subpath.
     */
    let SEG_MOVETO: number;
    /**
     * The segment type constant for a point that specifies the end point of a
     * line to be drawn from the most recently specified point.
     */
    let SEG_LINETO: number;
    /**
     * The segment type constant for the pair of points that specify a quadratic
     * parametric curve to be drawn from the most recently specified point. The
     * curve is interpolated by solving the parametric control equation in the
     * range <code>(t=[0..1])</code> using the most recently specified (current)
     * point (CP), the first control point (P1), and the final interpolated
     * control point (P2). The parametric control equation for this curve is:
     *
     * <pre>
     * P(t) = B(2,0)*CP + B(2,1)*P1 + B(2,2)*P2
     * 0 &lt;= t &lt;= 1
     *
     * B(n,m) = mth coefficient of nth degree Bernstein polynomial
     * = C(n,m) * t^(m) * (1 - t)^(n-m)
     * C(n,m) = Combinations of n things, taken m at a time
     * = n! / (m! * (n-m)!)
     * </pre>
     */
    let SEG_QUADTO: number;
    /**
     * The segment type constant for the set of 3 points that specify a cubic
     * parametric curve to be drawn from the most recently specified point. The
     * curve is interpolated by solving the parametric control equation in the
     * range <code>(t=[0..1])</code> using the most recently specified (current)
     * point (CP), the first control point (P1), the second control point (P2),
     * and the final interpolated control point (P3). The parametric control
     * equation for this curve is:
     *
     * <pre>
     * P(t) = B(3,0)*CP + B(3,1)*P1 + B(3,2)*P2 + B(3,3)*P3
     * 0 &lt;= t &lt;= 1
     *
     * B(n,m) = mth coefficient of nth degree Bernstein polynomial
     * = C(n,m) * t^(m) * (1 - t)^(n-m)
     * C(n,m) = Combinations of n things, taken m at a time
     * = n! / (m! * (n-m)!)
     * </pre>
     *
     * This form of curve is commonly known as a B&eacute;zier curve.
     */
    let SEG_CUBICTO: number;
    /**
     * The segment type constant that specifies that the preceding subpath
     * should be closed by appending a line segment back to the point
     * corresponding to the most recent SEG_MOVETO.
     */
    let SEG_CLOSE: number;
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.Point2D.Float
 * @see java.awt.geom.Point2D.Double
 * @see java.awt.Point
 * @since 1.2
 * @class
 */
declare abstract class Point2D {
    constructor();
    /**
     * Returns the X coordinate of this <code>Point2D</code> in
     * <code>double</code> precision.
     *
     * @return {number} the X coordinate of this <code>Point2D</code>.
     * @since 1.2
     */
    abstract getX(): number;
    /**
     * Returns the Y coordinate of this <code>Point2D</code> in
     * <code>double</code> precision.
     *
     * @return {number} the Y coordinate of this <code>Point2D</code>.
     * @since 1.2
     */
    abstract getY(): number;
    /**
     * Sets the location of this <code>Point2D</code> to the specified
     * <code>float</code> coordinates.
     *
     * @param {number} x
     * the new X coordinate of this {@code Point2D}
     * @param {number} y
     * the new Y coordinate of this {@code Point2D}
     * @since 1.2
     */
    setLocation(x?: any, y?: any): any;
    /**
     * Sets the location of this <code>Point2D</code> to the specified
     * <code>double</code> coordinates.
     *
     * @param {number} x
     * the new X coordinate of this {@code Point2D}
     * @param {number} y
     * the new Y coordinate of this {@code Point2D}
     * @since 1.2
     */
    setLocation$double$double(x: number, y: number): void;
    /**
     * Sets the location of this <code>Point2D</code> to the same coordinates as
     * the specified <code>Point2D</code> object.
     *
     * @param {Point2D} p
     * the specified <code>Point2D</code> to which to set this
     * <code>Point2D</code>
     * @since 1.2
     */
    setLocation$java_awt_geom_Point2D(p: Point2D): void;
    /**
     * Returns the square of the distance between two points.
     *
     * @param {number} x1
     * the X coordinate of the first specified point
     * @param {number} y1
     * the Y coordinate of the first specified point
     * @param {number} x2
     * the X coordinate of the second specified point
     * @param {number} y2
     * the Y coordinate of the second specified point
     * @return {number} the square of the distance between the two sets of specified
     * coordinates.
     * @since 1.2
     */
    static distanceSq(x1: number, y1: number, x2: number, y2: number): number;
    /**
     * Returns the distance between two points.
     *
     * @param {number} x1
     * the X coordinate of the first specified point
     * @param {number} y1
     * the Y coordinate of the first specified point
     * @param {number} x2
     * the X coordinate of the second specified point
     * @param {number} y2
     * the Y coordinate of the second specified point
     * @return {number} the distance between the two sets of specified coordinates.
     * @since 1.2
     */
    static distance(x1: number, y1: number, x2: number, y2: number): number;
    /**
     * Returns the square of the distance from this <code>Point2D</code> to a
     * specified point.
     *
     * @param {number} px
     * the X coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @return {number} the square of the distance between this <code>Point2D</code> and
     * the specified point.
     * @since 1.2
     */
    distanceSq$double$double(px: number, py: number): number;
    /**
     * Returns the square of the distance from this <code>Point2D</code> to a
     * specified point.
     *
     * @param {number} px
     * the X coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @return {number} the square of the distance between this <code>Point2D</code> and
     * the specified point.
     * @since 1.2
     */
    distanceSq(px?: any, py?: any): any;
    /**
     * Returns the square of the distance from this <code>Point2D</code> to a
     * specified <code>Point2D</code>.
     *
     * @param {Point2D} pt
     * the specified point to be measured against this
     * <code>Point2D</code>
     * @return {number} the square of the distance between this <code>Point2D</code> to a
     * specified <code>Point2D</code>.
     * @since 1.2
     */
    distanceSq$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Returns the distance from this <code>Point2D</code> to a specified point.
     *
     * @param {number} px
     * the X coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @return {number} the distance between this <code>Point2D</code> and a specified
     * point.
     * @since 1.2
     */
    distance$double$double(px: number, py: number): number;
    /**
     * Returns the distance from this <code>Point2D</code> to a specified point.
     *
     * @param {number} px
     * the X coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @param {number} py
     * the Y coordinate of the specified point to be measured against
     * this <code>Point2D</code>
     * @return {number} the distance between this <code>Point2D</code> and a specified
     * point.
     * @since 1.2
     */
    distance(px?: any, py?: any): any;
    /**
     * Returns the distance from this <code>Point2D</code> to a specified
     * <code>Point2D</code>.
     *
     * @param {Point2D} pt
     * the specified point to be measured against this
     * <code>Point2D</code>
     * @return {number} the distance between this <code>Point2D</code> and the specified
     * <code>Point2D</code>.
     * @since 1.2
     */
    distance$java_awt_geom_Point2D(pt: Point2D): number;
    /**
     * Creates a new object of the same class and with the same contents as this
     * object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
    /**
     * Determines whether or not two points are equal. Two instances of
     * <code>Point2D</code> are equal if the values of their <code>x</code> and
     * <code>y</code> member fields, representing their position in the
     * coordinate space, are the same.
     *
     * @param {*} obj
     * an object to be compared with this <code>Point2D</code>
     * @return {boolean} <code>true</code> if the object to be compared is an instance of
     * <code>Point2D</code> and has the same values; <code>false</code>
     * otherwise.
     * @since 1.2
     */
    equals(obj: any): boolean;
}
declare namespace Point2D {
    /**
     * Constructs and initializes a <code>Point2D</code> with the specified
     * coordinates.
     *
     * @param {number} x
     * the X coordinate of the newly constructed
     * <code>Point2D</code>
     * @param {number} y
     * the Y coordinate of the newly constructed
     * <code>Point2D</code>
     * @since 1.2
     * @class
     */
    class Float extends Point2D {
        /**
         * The X coordinate of this <code>Point2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>Point2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        constructor(x?: any, y?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         */
        setLocation$double$double(x: number, y: number): void;
        /**
         * Sets the location of this <code>Point2D</code> to the specified
         * <code>float</code> coordinates.
         *
         * @param {number} x
         * the new X coordinate of this {@code Point2D}
         * @param {number} y
         * the new Y coordinate of this {@code Point2D}
         * @since 1.2
         */
        setLocation$float$float(x: number, y: number): void;
        /**
         * Sets the location of this <code>Point2D</code> to the specified
         * <code>float</code> coordinates.
         *
         * @param {number} x
         * the new X coordinate of this {@code Point2D}
         * @param {number} y
         * the new Y coordinate of this {@code Point2D}
         * @since 1.2
         */
        setLocation(x?: any, y?: any): any;
        /**
         * Returns a <code>String</code> that represents the value of this
         * <code>Point2D</code>.
         *
         * @return {string} a string representation of this <code>Point2D</code>.
         * @since 1.2
         */
        toString(): string;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a <code>Point2D</code> with the specified
     * coordinates.
     *
     * @param {number} x
     * the X coordinate of the newly constructed
     * <code>Point2D</code>
     * @param {number} y
     * the Y coordinate of the newly constructed
     * <code>Point2D</code>
     * @since 1.2
     * @class
     */
    class Double extends Point2D {
        /**
         * The X coordinate of this <code>Point2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>Point2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        constructor(x?: any, y?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * Sets the location of this <code>Point2D</code> to the specified
         * <code>float</code> coordinates.
         *
         * @param {number} x
         * the new X coordinate of this {@code Point2D}
         * @param {number} y
         * the new Y coordinate of this {@code Point2D}
         * @since 1.2
         */
        setLocation(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         */
        setLocation$double$double(x: number, y: number): void;
        /**
         * Returns a <code>String</code> that represents the value of this
         * <code>Point2D</code>.
         *
         * @return {string} a string representation of this <code>Point2D</code>.
         * @since 1.2
         */
        toString(): string;
        static serialVersionUID: number;
    }
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.QuadCurve2D.Float
 * @see java.awt.geom.QuadCurve2D.Double
 * @since 1.2
 * @class
 */
declare abstract class QuadCurve2D implements java.awt.Shape {
    abstract getBounds2D(): any;
    constructor();
    /**
     * Returns the X coordinate of the start point in <code>double</code> in
     * precision.
     *
     * @return {number} the X coordinate of the start point.
     * @since 1.2
     */
    abstract getX1(): number;
    /**
     * Returns the Y coordinate of the start point in <code>double</code>
     * precision.
     *
     * @return {number} the Y coordinate of the start point.
     * @since 1.2
     */
    abstract getY1(): number;
    /**
     * Returns the start point.
     *
     * @return {Point2D} a <code>Point2D</code> that is the start point of this
     * <code>QuadCurve2D</code>.
     * @since 1.2
     */
    abstract getP1(): Point2D;
    /**
     * Returns the X coordinate of the control point in <code>double</code>
     * precision.
     *
     * @return {number} X coordinate the control point
     * @since 1.2
     */
    abstract getCtrlX(): number;
    /**
     * Returns the Y coordinate of the control point in <code>double</code>
     * precision.
     *
     * @return {number} the Y coordinate of the control point.
     * @since 1.2
     */
    abstract getCtrlY(): number;
    /**
     * Returns the control point.
     *
     * @return {Point2D} a <code>Point2D</code> that is the control point of this
     * <code>Point2D</code>.
     * @since 1.2
     */
    abstract getCtrlPt(): Point2D;
    /**
     * Returns the X coordinate of the end point in <code>double</code>
     * precision.
     *
     * @return {number} the x coordinate of the end point.
     * @since 1.2
     */
    abstract getX2(): number;
    /**
     * Returns the Y coordinate of the end point in <code>double</code>
     * precision.
     *
     * @return {number} the Y coordinate of the end point.
     * @since 1.2
     */
    abstract getY2(): number;
    /**
     * Returns the end point.
     *
     * @return {Point2D} a <code>Point</code> object that is the end point of this
     * <code>Point2D</code>.
     * @since 1.2
     */
    abstract getP2(): Point2D;
    /**
     * Sets the location of the end points and control point of this curve
     * to the specified {@code float} coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     */
    setCurve(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any): any;
    /**
     * Sets the location of the end points and control point of this curve to
     * the specified <code>double</code> coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     */
    setCurve$double$double$double$double$double$double(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): void;
    /**
     * Sets the location of the end points and control points of this
     * <code>QuadCurve2D</code> to the <code>double</code> coordinates at the
     * specified offset in the specified array.
     *
     * @param {Array} coords
     * the array containing coordinate values
     * @param {number} offset
     * the index into the array from which to start getting the
     * coordinate values and assigning them to this
     * <code>QuadCurve2D</code>
     * @since 1.2
     */
    setCurve$double_A$int(coords: number[], offset: number): void;
    /**
     * Sets the location of the end points and control point of this
     * <code>QuadCurve2D</code> to the specified <code>Point2D</code>
     * coordinates.
     *
     * @param {Point2D} p1
     * the start point
     * @param {Point2D} cp
     * the control point
     * @param {Point2D} p2
     * the end point
     * @since 1.2
     */
    setCurve$java_awt_geom_Point2D$java_awt_geom_Point2D$java_awt_geom_Point2D(p1: Point2D, cp: Point2D, p2: Point2D): void;
    /**
     * Sets the location of the end points and control points of this
     * <code>QuadCurve2D</code> to the coordinates of the <code>Point2D</code>
     * objects at the specified offset in the specified array.
     *
     * @param {Array} pts
     * an array containing <code>Point2D</code> that define
     * coordinate values
     * @param {number} offset
     * the index into <code>pts</code> from which to start getting
     * the coordinate values and assigning them to this
     * <code>QuadCurve2D</code>
     * @since 1.2
     */
    setCurve$java_awt_geom_Point2D_A$int(pts: Point2D[], offset: number): void;
    /**
     * Sets the location of the end points and control point of this
     * <code>QuadCurve2D</code> to the same as those in the specified
     * <code>QuadCurve2D</code>.
     *
     * @param {QuadCurve2D} c
     * the specified <code>QuadCurve2D</code>
     * @since 1.2
     */
    setCurve$java_awt_geom_QuadCurve2D(c: QuadCurve2D): void;
    /**
     * Returns the square of the flatness, or maximum distance of a control
     * point from the line connecting the end points, of the quadratic curve
     * specified by the indicated control points.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @return {number} the square of the flatness of the quadratic curve defined by the
     * specified coordinates.
     * @since 1.2
     */
    static getFlatnessSq$double$double$double$double$double$double(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): number;
    /**
     * Returns the square of the flatness, or maximum distance of a control
     * point from the line connecting the end points, of the quadratic curve
     * specified by the indicated control points.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @return {number} the square of the flatness of the quadratic curve defined by the
     * specified coordinates.
     * @since 1.2
     */
    static getFlatnessSq(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any): any;
    /**
     * Returns the flatness, or maximum distance of a control point from the
     * line connecting the end points, of the quadratic curve specified by the
     * indicated control points.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @return {number} the flatness of the quadratic curve defined by the specified
     * coordinates.
     * @since 1.2
     */
    static getFlatness$double$double$double$double$double$double(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): number;
    /**
     * Returns the flatness, or maximum distance of a control point from the
     * line connecting the end points, of the quadratic curve specified by the
     * indicated control points.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @return {number} the flatness of the quadratic curve defined by the specified
     * coordinates.
     * @since 1.2
     */
    static getFlatness(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any): any;
    /**
     * Returns the square of the flatness, or maximum distance of a control
     * point from the line connecting the end points, of the quadratic curve
     * specified by the control points stored in the indicated array at the
     * indicated index.
     *
     * @param {Array} coords
     * an array containing coordinate values
     * @param {number} offset
     * the index into <code>coords</code> from which to to start
     * getting the values from the array
     * @return {number} the flatness of the quadratic curve that is defined by the values
     * in the specified array at the specified index.
     * @since 1.2
     */
    static getFlatnessSq$double_A$int(coords: number[], offset: number): number;
    /**
     * Returns the flatness, or maximum distance of a control point from the
     * line connecting the end points, of the quadratic curve specified by the
     * control points stored in the indicated array at the indicated index.
     *
     * @param {Array} coords
     * an array containing coordinate values
     * @param {number} offset
     * the index into <code>coords</code> from which to start getting
     * the coordinate values
     * @return {number} the flatness of a quadratic curve defined by the specified array
     * at the specified offset.
     * @since 1.2
     */
    static getFlatness$double_A$int(coords: number[], offset: number): number;
    /**
     * Returns the square of the flatness, or maximum distance of a control
     * point from the line connecting the end points, of this
     * <code>QuadCurve2D</code>.
     *
     * @return {number} the square of the flatness of this <code>QuadCurve2D</code>.
     * @since 1.2
     */
    getFlatnessSq(): number;
    /**
     * Returns the flatness, or maximum distance of a control point from the
     * line connecting the end points, of this <code>QuadCurve2D</code>.
     *
     * @return {number} the flatness of this <code>QuadCurve2D</code>.
     * @since 1.2
     */
    getFlatness(): number;
    /**
     * Subdivides this <code>QuadCurve2D</code> and stores the resulting two
     * subdivided curves into the <code>left</code> and <code>right</code> curve
     * parameters. Either or both of the <code>left</code> and
     * <code>right</code> objects can be the same as this
     * <code>QuadCurve2D</code> or <code>null</code>.
     *
     * @param {QuadCurve2D} left
     * the <code>QuadCurve2D</code> object for storing the left or
     * first half of the subdivided curve
     * @param {QuadCurve2D} right
     * the <code>QuadCurve2D</code> object for storing the right or
     * second half of the subdivided curve
     * @since 1.2
     */
    subdivide(left: QuadCurve2D, right: QuadCurve2D): void;
    /**
     * Subdivides the quadratic curve specified by the <code>src</code>
     * parameter and stores the resulting two subdivided curves into the
     * <code>left</code> and <code>right</code> curve parameters. Either or both
     * of the <code>left</code> and <code>right</code> objects can be the same
     * as the <code>src</code> object or <code>null</code>.
     *
     * @param {QuadCurve2D} src
     * the quadratic curve to be subdivided
     * @param {QuadCurve2D} left
     * the <code>QuadCurve2D</code> object for storing the left or
     * first half of the subdivided curve
     * @param {QuadCurve2D} right
     * the <code>QuadCurve2D</code> object for storing the right or
     * second half of the subdivided curve
     * @since 1.2
     */
    static subdivide$java_awt_geom_QuadCurve2D$java_awt_geom_QuadCurve2D$java_awt_geom_QuadCurve2D(src: QuadCurve2D, left: QuadCurve2D, right: QuadCurve2D): void;
    /**
     * Subdivides the quadratic curve specified by the coordinates stored in the
     * <code>src</code> array at indices <code>srcoff</code> through
     * <code>srcoff</code>&nbsp;+&nbsp;5 and stores the resulting two subdivided
     * curves into the two result arrays at the corresponding indices. Either or
     * both of the <code>left</code> and <code>right</code> arrays can be
     * <code>null</code> or a reference to the same array and offset as the
     * <code>src</code> array. Note that the last point in the first subdivided
     * curve is the same as the first point in the second subdivided curve.
     * Thus, it is possible to pass the same array for <code>left</code> and
     * <code>right</code> and to use offsets such that <code>rightoff</code>
     * equals <code>leftoff</code> + 4 in order to avoid allocating extra
     * storage for this common point.
     *
     * @param {Array} src
     * the array holding the coordinates for the source curve
     * @param {number} srcoff
     * the offset into the array of the beginning of the the 6 source
     * coordinates
     * @param {Array} left
     * the array for storing the coordinates for the first half of
     * the subdivided curve
     * @param {number} leftoff
     * the offset into the array of the beginning of the the 6 left
     * coordinates
     * @param {Array} right
     * the array for storing the coordinates for the second half of
     * the subdivided curve
     * @param {number} rightoff
     * the offset into the array of the beginning of the the 6 right
     * coordinates
     * @since 1.2
     */
    static subdivide$double_A$int$double_A$int$double_A$int(src: number[], srcoff: number, left: number[], leftoff: number, right: number[], rightoff: number): void;
    /**
     * Subdivides the quadratic curve specified by the coordinates stored in the
     * <code>src</code> array at indices <code>srcoff</code> through
     * <code>srcoff</code>&nbsp;+&nbsp;5 and stores the resulting two subdivided
     * curves into the two result arrays at the corresponding indices. Either or
     * both of the <code>left</code> and <code>right</code> arrays can be
     * <code>null</code> or a reference to the same array and offset as the
     * <code>src</code> array. Note that the last point in the first subdivided
     * curve is the same as the first point in the second subdivided curve.
     * Thus, it is possible to pass the same array for <code>left</code> and
     * <code>right</code> and to use offsets such that <code>rightoff</code>
     * equals <code>leftoff</code> + 4 in order to avoid allocating extra
     * storage for this common point.
     *
     * @param {Array} src
     * the array holding the coordinates for the source curve
     * @param {number} srcoff
     * the offset into the array of the beginning of the the 6 source
     * coordinates
     * @param {Array} left
     * the array for storing the coordinates for the first half of
     * the subdivided curve
     * @param {number} leftoff
     * the offset into the array of the beginning of the the 6 left
     * coordinates
     * @param {Array} right
     * the array for storing the coordinates for the second half of
     * the subdivided curve
     * @param {number} rightoff
     * the offset into the array of the beginning of the the 6 right
     * coordinates
     * @since 1.2
     */
    static subdivide(src?: any, srcoff?: any, left?: any, leftoff?: any, right?: any, rightoff?: any): any;
    /**
     * Solves the quadratic whose coefficients are in the <code>eqn</code> array
     * and places the non-complex roots back into the same array, returning the
     * number of roots. The quadratic solved is represented by the equation:
     *
     * <pre>
     * eqn = {C, B, A};
     * ax^2 + bx + c = 0
     * </pre>
     *
     * A return value of <code>-1</code> is used to distinguish a constant
     * equation, which might be always 0 or never 0, from an equation that has
     * no zeroes.
     *
     * @param {Array} eqn
     * the array that contains the quadratic coefficients
     * @return {number} the number of roots, or <code>-1</code> if the equation is a
     * constant
     * @since 1.2
     */
    static solveQuadratic$double_A(eqn: number[]): number;
    /**
     * Solves the quadratic whose coefficients are in the <code>eqn</code> array
     * and places the non-complex roots into the <code>res</code> array,
     * returning the number of roots. The quadratic solved is represented by the
     * equation:
     *
     * <pre>
     * eqn = {C, B, A};
     * ax^2 + bx + c = 0
     * </pre>
     *
     * A return value of <code>-1</code> is used to distinguish a constant
     * equation, which might be always 0 or never 0, from an equation that has
     * no zeroes.
     *
     * @param {Array} eqn
     * the specified array of coefficients to use to solve the
     * quadratic equation
     * @param {Array} res
     * the array that contains the non-complex roots resulting from
     * the solution of the quadratic equation
     * @return {number} the number of roots, or <code>-1</code> if the equation is a
     * constant.
     * @since 1.3
     */
    static solveQuadratic$double_A$double_A(eqn: number[], res: number[]): number;
    /**
     * Solves the quadratic whose coefficients are in the <code>eqn</code> array
     * and places the non-complex roots into the <code>res</code> array,
     * returning the number of roots. The quadratic solved is represented by the
     * equation:
     *
     * <pre>
     * eqn = {C, B, A};
     * ax^2 + bx + c = 0
     * </pre>
     *
     * A return value of <code>-1</code> is used to distinguish a constant
     * equation, which might be always 0 or never 0, from an equation that has
     * no zeroes.
     *
     * @param {Array} eqn
     * the specified array of coefficients to use to solve the
     * quadratic equation
     * @param {Array} res
     * the array that contains the non-complex roots resulting from
     * the solution of the quadratic equation
     * @return {number} the number of roots, or <code>-1</code> if the equation is a
     * constant.
     * @since 1.3
     */
    static solveQuadratic(eqn?: any, res?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Point2D} p
     * @return {boolean}
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * Fill an array with the coefficients of the parametric equation in t,
     * ready for solving against val with solveQuadratic. We currently have: val
     * = Py(t) = C1*(1-t)^2 + 2*CP*t*(1-t) + C2*t^2 = C1 - 2*C1*t + C1*t^2 +
     * 2*CP*t - 2*CP*t^2 + C2*t^2 = C1 + (2*CP - 2*C1)*t + (C1 - 2*CP + C2)*t^2
     * 0 = (C1 - val) + (2*CP - 2*C1)*t + (C1 - 2*CP + C2)*t^2 0 = C + Bt + At^2
     * C = C1 - val B = 2*CP - 2*C1 A = C1 - 2*CP + C2
     * @param {Array} eqn
     * @param {number} val
     * @param {number} c1
     * @param {number} cp
     * @param {number} c2
     * @private
     */
    static fillEqn(eqn: number[], val: number, c1: number, cp: number, c2: number): void;
    /**
     * Evaluate the t values in the first num slots of the vals[] array and
     * place the evaluated values back into the same array. Only evaluate t
     * values that are within the range &lt;0, 1&gt;, including the 0 and 1 ends
     * of the range iff the include0 or include1 booleans are true. If an
     * "inflection" equation is handed in, then any points which represent a
     * point of inflection for that quadratic equation are also ignored.
     * @param {Array} vals
     * @param {number} num
     * @param {boolean} include0
     * @param {boolean} include1
     * @param {Array} inflect
     * @param {number} c1
     * @param {number} ctrl
     * @param {number} c2
     * @return {number}
     * @private
     */
    static evalQuadratic(vals: number[], num: number, include0: boolean, include1: boolean, inflect: number[], c1: number, ctrl: number, c2: number): number;
    static BELOW: number;
    static LOWEDGE: number;
    static INSIDE: number;
    static HIGHEDGE: number;
    static ABOVE: number;
    /**
     * Determine where coord lies with respect to the range from low to high. It
     * is assumed that low &lt;= high. The return value is one of the 5 values
     * BELOW, LOWEDGE, INSIDE, HIGHEDGE, or ABOVE.
     * @param {number} coord
     * @param {number} low
     * @param {number} high
     * @return {number}
     * @private
     */
    static getTag(coord: number, low: number, high: number): number;
    /**
     * Determine if the pttag represents a coordinate that is already in its
     * test range, or is on the border with either of the two opttags
     * representing another coordinate that is "towards the inside" of that test
     * range. In other words, are either of the two "opt" points
     * "drawing the pt inward"?
     * @param {number} pttag
     * @param {number} opt1tag
     * @param {number} opt2tag
     * @return {boolean}
     * @private
     */
    static inwards(pttag: number, opt1tag: number, opt2tag: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Returns an iteration object that defines the boundary of the shape of
     * this <code>QuadCurve2D</code>. The iterator for this class is not
     * multi-threaded safe, which means that this <code>QuadCurve2D</code> class
     * does not guarantee that modifications to the geometry of this
     * <code>QuadCurve2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional {@link AffineTransform} to apply to the shape
     * boundary
     * @return {PathIterator} a {@link PathIterator} object that defines the boundary of the
     * shape.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of the flattened
     * shape of this <code>QuadCurve2D</code>. The iterator for this class is
     * not multi-threaded safe, which means that this <code>QuadCurve2D</code>
     * class does not guarantee that modifications to the geometry of this
     * <code>QuadCurve2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to apply to the
     * boundary of the shape
     * @param {number} flatness
     * the maximum distance that the control points for a subdivided
     * curve can be with respect to a line connecting the end points
     * of this curve before this curve is replaced by a straight line
     * connecting the end points.
     * @return {PathIterator} a <code>PathIterator</code> object that defines the flattened
     * boundary of the shape.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of the flattened
     * shape of this <code>QuadCurve2D</code>. The iterator for this class is
     * not multi-threaded safe, which means that this <code>QuadCurve2D</code>
     * class does not guarantee that modifications to the geometry of this
     * <code>QuadCurve2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to apply to the
     * boundary of the shape
     * @param {number} flatness
     * the maximum distance that the control points for a subdivided
     * curve can be with respect to a line connecting the end points
     * of this curve before this curve is replaced by a straight line
     * connecting the end points.
     * @return {PathIterator} a <code>PathIterator</code> object that defines the flattened
     * boundary of the shape.
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Creates a new object of the same class and with the same contents as this
     * object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
}
declare namespace QuadCurve2D {
    /**
     * Constructs and initializes a <code>QuadCurve2D</code> from the
     * specified {@code float} coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     * @class
     */
    class Float extends QuadCurve2D {
        /**
         * The X coordinate of the start point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the control point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx: number;
        /**
         * The Y coordinate of the control point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly: number;
        /**
         * The X coordinate of the end point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlPt(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} ctrlx
         * @param {number} ctrly
         * @param {number} x2
         * @param {number} y2
         */
        setCurve$double$double$double$double$double$double(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points and control point of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} ctrlx
         * the X coordinate of the control point
         * @param {number} ctrly
         * the Y coordinate of the control point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setCurve$float$float$float$float$float$float(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): void;
        /**
         * Sets the location of the end points and control point of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} ctrlx
         * the X coordinate of the control point
         * @param {number} ctrly
         * the Y coordinate of the control point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setCurve(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a <code>QuadCurve2D</code> from the
     * specified {@code double} coordinates.
     *
     * @param {number} x1
     * the X coordinate of the start point
     * @param {number} y1
     * the Y coordinate of the start point
     * @param {number} ctrlx
     * the X coordinate of the control point
     * @param {number} ctrly
     * the Y coordinate of the control point
     * @param {number} x2
     * the X coordinate of the end point
     * @param {number} y2
     * the Y coordinate of the end point
     * @since 1.2
     * @class
     */
    class Double extends QuadCurve2D {
        /**
         * The X coordinate of the start point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x1: number;
        /**
         * The Y coordinate of the start point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y1: number;
        /**
         * The X coordinate of the control point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        ctrlx: number;
        /**
         * The Y coordinate of the control point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        ctrly: number;
        /**
         * The X coordinate of the end point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        x2: number;
        /**
         * The Y coordinate of the end point of the quadratic curve segment.
         *
         * @since 1.2
         * @serial
         */
        y2: number;
        constructor(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY1(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP1(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getCtrlY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getCtrlPt(): Point2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY2(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Point2D}
         */
        getP2(): Point2D;
        /**
         * Sets the location of the end points and control point of this curve
         * to the specified {@code float} coordinates.
         *
         * @param {number} x1
         * the X coordinate of the start point
         * @param {number} y1
         * the Y coordinate of the start point
         * @param {number} ctrlx
         * the X coordinate of the control point
         * @param {number} ctrly
         * the Y coordinate of the control point
         * @param {number} x2
         * the X coordinate of the end point
         * @param {number} y2
         * the Y coordinate of the end point
         * @since 1.2
         */
        setCurve(x1?: any, y1?: any, ctrlx?: any, ctrly?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x1
         * @param {number} y1
         * @param {number} ctrlx
         * @param {number} ctrly
         * @param {number} x2
         * @param {number} y2
         */
        setCurve$double$double$double$double$double$double(x1: number, y1: number, ctrlx: number, ctrly: number, x2: number, y2: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
}
/**
 * A utility class to iterate over the path segments of a quadratic curve
 * segment through the PathIterator interface.
 *
 * @author Jim Graham
 */
declare class QuadIterator implements PathIterator {
    quad: QuadCurve2D;
    affine: AffineTransform;
    index: number;
    constructor(q: QuadCurve2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    next(doNext?: any): any;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next$(): void;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * This is an abstract class that cannot be instantiated directly.
 *
 * @see Arc2D
 * @see Ellipse2D
 * @see Rectangle2D
 * @see RoundRectangle2D
 * @since 1.2
 * @class
 */
declare abstract class RectangularShape implements java.awt.Shape {
    abstract getBounds2D(): any;
    abstract intersects(x: any, y: any, w: any, h: any): any;
    constructor();
    /**
     * Returns the X coordinate of the upper-left corner of the framing
     * rectangle in <code>double</code> precision.
     *
     * @return {number} the X coordinate of the upper-left corner of the framing
     * rectangle.
     * @since 1.2
     */
    abstract getX(): number;
    /**
     * Returns the Y coordinate of the upper-left corner of the framing
     * rectangle in <code>double</code> precision.
     *
     * @return {number} the Y coordinate of the upper-left corner of the framing
     * rectangle.
     * @since 1.2
     */
    abstract getY(): number;
    /**
     * Returns the width of the framing rectangle in <code>double</code>
     * precision.
     *
     * @return {number} the width of the framing rectangle.
     * @since 1.2
     */
    abstract getWidth(): number;
    /**
     * Returns the height of the framing rectangle in <code>double</code>
     * precision.
     *
     * @return {number} the height of the framing rectangle.
     * @since 1.2
     */
    abstract getHeight(): number;
    /**
     * Returns the smallest X coordinate of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the smallest X coordinate of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getMinX(): number;
    /**
     * Returns the smallest Y coordinate of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the smallest Y coordinate of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getMinY(): number;
    /**
     * Returns the largest X coordinate of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the largest X coordinate of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getMaxX(): number;
    /**
     * Returns the largest Y coordinate of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the largest Y coordinate of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getMaxY(): number;
    /**
     * Returns the X coordinate of the center of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the X coordinate of the center of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getCenterX(): number;
    /**
     * Returns the Y coordinate of the center of the framing rectangle of the
     * <code>Shape</code> in <code>double</code> precision.
     *
     * @return {number} the Y coordinate of the center of the framing rectangle of the
     * <code>Shape</code>.
     * @since 1.2
     */
    getCenterY(): number;
    /**
     * Returns the framing {@link Rectangle2D} that defines the overall shape of
     * this object.
     *
     * @return {Rectangle2D} a <code>Rectangle2D</code>, specified in <code>double</code>
     * coordinates.
     * @see #setFrame(double, double, double, double)
     * @see #setFrame(Point2D, Dimension2D)
     * @see #setFrame(Rectangle2D)
     * @since 1.2
     */
    getFrame(): Rectangle2D;
    /**
     * Determines whether the <code>RectangularShape</code> is empty. When the
     * <code>RectangularShape</code> is empty, it encloses no area.
     *
     * @return {boolean} <code>true</code> if the <code>RectangularShape</code> is empty;
     * <code>false</code> otherwise.
     * @since 1.2
     */
    abstract isEmpty(): boolean;
    setFrame(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Sets the location and size of the framing rectangle of this
     * <code>Shape</code> to the specified rectangular values.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the specified
     * rectangular shape
     * @param {number} y
     * the Y coordinate of the upper-left corner of the specified
     * rectangular shape
     * @param {number} w
     * the width of the specified rectangular shape
     * @param {number} h
     * the height of the specified rectangular shape
     * @see #getFrame
     * @since 1.2
     */
    setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
    /**
     * Sets the location and size of the framing rectangle of this
     * <code>Shape</code> to the specified {@link Point2D} and
     * {@link Dimension2D}, respectively. The framing rectangle is used by the
     * subclasses of <code>RectangularShape</code> to define their geometry.
     *
     * @param {Point2D} loc
     * the specified <code>Point2D</code>
     * @param {Dimension2D} size
     * the specified <code>Dimension2D</code>
     * @see #getFrame
     * @since 1.2
     */
    setFrame$java_awt_geom_Point2D$java_awt_geom_Dimension2D(loc: Point2D, size: Dimension2D): void;
    /**
     * Sets the framing rectangle of this <code>Shape</code> to be the specified
     * <code>Rectangle2D</code>. The framing rectangle is used by the subclasses
     * of <code>RectangularShape</code> to define their geometry.
     *
     * @param {Rectangle2D} r
     * the specified <code>Rectangle2D</code>
     * @see #getFrame
     * @since 1.2
     */
    setFrame$java_awt_geom_Rectangle2D(r: Rectangle2D): void;
    /**
     * Sets the diagonal of the framing rectangle of this <code>Shape</code>
     * based on the two specified coordinates. The framing rectangle is used by
     * the subclasses of <code>RectangularShape</code> to define their geometry.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified diagonal
     * @param {number} y1
     * the Y coordinate of the start point of the specified diagonal
     * @param {number} x2
     * the X coordinate of the end point of the specified diagonal
     * @param {number} y2
     * the Y coordinate of the end point of the specified diagonal
     * @since 1.2
     */
    setFrameFromDiagonal$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Sets the diagonal of the framing rectangle of this <code>Shape</code>
     * based on the two specified coordinates. The framing rectangle is used by
     * the subclasses of <code>RectangularShape</code> to define their geometry.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified diagonal
     * @param {number} y1
     * the Y coordinate of the start point of the specified diagonal
     * @param {number} x2
     * the X coordinate of the end point of the specified diagonal
     * @param {number} y2
     * the Y coordinate of the end point of the specified diagonal
     * @since 1.2
     */
    setFrameFromDiagonal(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Sets the diagonal of the framing rectangle of this <code>Shape</code>
     * based on two specified <code>Point2D</code> objects. The framing
     * rectangle is used by the subclasses of <code>RectangularShape</code> to
     * define their geometry.
     *
     * @param {Point2D} p1
     * the start <code>Point2D</code> of the specified diagonal
     * @param {Point2D} p2
     * the end <code>Point2D</code> of the specified diagonal
     * @since 1.2
     */
    setFrameFromDiagonal$java_awt_geom_Point2D$java_awt_geom_Point2D(p1: Point2D, p2: Point2D): void;
    /**
     * Sets the framing rectangle of this <code>Shape</code> based on the
     * specified center point coordinates and corner point coordinates. The
     * framing rectangle is used by the subclasses of
     * <code>RectangularShape</code> to define their geometry.
     *
     * @param {number} centerX
     * the X coordinate of the specified center point
     * @param {number} centerY
     * the Y coordinate of the specified center point
     * @param {number} cornerX
     * the X coordinate of the specified corner point
     * @param {number} cornerY
     * the Y coordinate of the specified corner point
     * @since 1.2
     */
    setFrameFromCenter$double$double$double$double(centerX: number, centerY: number, cornerX: number, cornerY: number): void;
    /**
     * Sets the framing rectangle of this <code>Shape</code> based on the
     * specified center point coordinates and corner point coordinates. The
     * framing rectangle is used by the subclasses of
     * <code>RectangularShape</code> to define their geometry.
     *
     * @param {number} centerX
     * the X coordinate of the specified center point
     * @param {number} centerY
     * the Y coordinate of the specified center point
     * @param {number} cornerX
     * the X coordinate of the specified corner point
     * @param {number} cornerY
     * the Y coordinate of the specified corner point
     * @since 1.2
     */
    setFrameFromCenter(centerX?: any, centerY?: any, cornerX?: any, cornerY?: any): any;
    /**
     * Sets the framing rectangle of this <code>Shape</code> based on a
     * specified center <code>Point2D</code> and corner <code>Point2D</code>.
     * The framing rectangle is used by the subclasses of
     * <code>RectangularShape</code> to define their geometry.
     *
     * @param {Point2D} center
     * the specified center <code>Point2D</code>
     * @param {Point2D} corner
     * the specified corner <code>Point2D</code>
     * @since 1.2
     */
    setFrameFromCenter$java_awt_geom_Point2D$java_awt_geom_Point2D(center: Point2D, corner: Point2D): void;
    contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Point2D} p
     * @return {boolean}
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Returns an iterator object that iterates along the <code>Shape</code>
     * object's boundary and provides access to a flattened view of the outline
     * of the <code>Shape</code> object's geometry.
     * <p>
     * Only SEG_MOVETO, SEG_LINETO, and SEG_CLOSE point types will be returned
     * by the iterator.
     * <p>
     * The amount of subdivision of the curved segments is controlled by the
     * <code>flatness</code> parameter, which specifies the maximum distance
     * that any point on the unflattened transformed curve can deviate from the
     * returned flattened path segments. An optional {@link AffineTransform} can
     * be specified so that the coordinates returned in the iteration are
     * transformed accordingly.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired.
     * @param {number} flatness
     * the maximum distance that the line segments used to
     * approximate the curved segments are allowed to deviate from
     * any point on the original curve
     * @return {PathIterator} a <code>PathIterator</code> object that provides access to the
     * <code>Shape</code> object's flattened geometry.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Returns an iterator object that iterates along the <code>Shape</code>
     * object's boundary and provides access to a flattened view of the outline
     * of the <code>Shape</code> object's geometry.
     * <p>
     * Only SEG_MOVETO, SEG_LINETO, and SEG_CLOSE point types will be returned
     * by the iterator.
     * <p>
     * The amount of subdivision of the curved segments is controlled by the
     * <code>flatness</code> parameter, which specifies the maximum distance
     * that any point on the unflattened transformed curve can deviate from the
     * returned flattened path segments. An optional {@link AffineTransform} can
     * be specified so that the coordinates returned in the iteration are
     * transformed accordingly.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired.
     * @param {number} flatness
     * the maximum distance that the line segments used to
     * approximate the curved segments are allowed to deviate from
     * any point on the original curve
     * @return {PathIterator} a <code>PathIterator</code> object that provides access to the
     * <code>Shape</code> object's flattened geometry.
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Creates a new object of the same class and with the same contents as this
     * object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.2
     */
    clone(): any;
}
/**
 * A utility class to iterate over the path segments of a rectangle through the
 * PathIterator interface.
 *
 * @author Jim Graham
 */
declare class RectIterator implements PathIterator {
    x: number;
    y: number;
    w: number;
    h: number;
    affine: AffineTransform;
    index: number;
    constructor(r: Rectangle2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    next(doNext?: any): any;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next$(): void;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
/**
 * A utility class to iterate over the path segments of an rounded rectangle
 * through the PathIterator interface.
 *
 * @author Jim Graham
 */
declare class RoundRectIterator implements PathIterator {
    x: number;
    y: number;
    w: number;
    h: number;
    aw: number;
    ah: number;
    affine: AffineTransform;
    index: number;
    constructor(rr: RoundRectangle2D, at: AffineTransform);
    /**
     * Return the winding rule for determining the insideness of the path.
     *
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @return {number}
     */
    getWindingRule(): number;
    /**
     * Tests if there are more points to read.
     *
     * @return {boolean} true if there are more points to read
     */
    isDone(): boolean;
    next(doNext?: any): any;
    /**
     * Moves the iterator to the next segment of the path forwards along the
     * primary direction of traversal as long as there are more points in that
     * direction.
     */
    next$(): void;
    static angle: number;
    static angle_$LI$(): number;
    static a: number;
    static a_$LI$(): number;
    static b: number;
    static b_$LI$(): number;
    static c: number;
    static c_$LI$(): number;
    static cv: number;
    static cv_$LI$(): number;
    static acv: number;
    static acv_$LI$(): number;
    static ctrlpts: number[][];
    static ctrlpts_$LI$(): number[][];
    static types: number[];
    static types_$LI$(): number[];
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$float_A(coords: number[]): number;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A float array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of float x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment(coords?: any): any;
    /**
     * Returns the coordinates and type of the current path segment in the
     * iteration. The return value is the path segment type: SEG_MOVETO,
     * SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, or SEG_CLOSE. A double array of
     * length 6 must be passed in and may be used to store the coordinates of
     * the point(s). Each point is stored as a pair of double x,y coordinates.
     * SEG_MOVETO and SEG_LINETO types will return one point, SEG_QUADTO will
     * return two points, SEG_CUBICTO will return 3 points and SEG_CLOSE will
     * not return any points.
     *
     * @see #SEG_MOVETO
     * @see #SEG_LINETO
     * @see #SEG_QUADTO
     * @see #SEG_CUBICTO
     * @see #SEG_CLOSE
     * @param {Array} coords
     * @return {number}
     */
    currentSegment$double_A(coords: number[]): number;
}
declare namespace java.awt {
    /**
     * The <code>Shape</code> interface provides definitions for objects
     * that represent some form of geometric shape.  The <code>Shape</code>
     * is described by a {@link PathIterator} object, which can express the
     * outline of the <code>Shape</code> as well as a rule for determining
     * how the outline divides the 2D plane into interior and exterior
     * points.  Each <code>Shape</code> object provides callbacks to get the
     * bounding box of the geometry, determine whether points or
     * rectangles lie partly or entirely within the interior
     * of the <code>Shape</code>, and retrieve a <code>PathIterator</code>
     * object that describes the trajectory path of the <code>Shape</code>
     * outline.
     * <p>
     * <a name="def_insideness"><b>Definition of insideness:</b></a>
     * A point is considered to lie inside a
     * <code>Shape</code> if and only if:
     * <ul>
     * <li> it lies completely
     * inside the<code>Shape</code> boundary <i>or</i>
     * <li>
     * it lies exactly on the <code>Shape</code> boundary <i>and</i> the
     * space immediately adjacent to the
     * point in the increasing <code>X</code> direction is
     * entirely inside the boundary <i>or</i>
     * <li>
     * it lies exactly on a horizontal boundary segment <b>and</b> the
     * space immediately adjacent to the point in the
     * increasing <code>Y</code> direction is inside the boundary.
     * </ul>
     * <p>The <code>contains</code> and <code>intersects</code> methods
     * consider the interior of a <code>Shape</code> to be the area it
     * encloses as if it were filled.  This means that these methods
     * consider
     * unclosed shapes to be implicitly closed for the purpose of
     * determining if a shape contains or intersects a rectangle or if a
     * shape contains a point.
     *
     * @see java.awt.geom.PathIterator
     * @see java.awt.geom.AffineTransform
     * @see java.awt.geom.FlatteningPathIterator
     * @see java.awt.geom.GeneralPath
     *
     * @author Jim Graham
     * @since 1.2
     */
    interface Shape {
        /**
         * Returns a high precision and more accurate bounding box of
         * the <code>Shape</code> than the <code>getBounds</code> method.
         * Note that there is no guarantee that the returned
         * {@link Rectangle2D} is the smallest bounding box that encloses
         * the <code>Shape</code>, only that the <code>Shape</code> lies
         * entirely within the indicated <code>Rectangle2D</code>.  The
         * bounding box returned by this method is usually tighter than that
         * returned by the <code>getBounds</code> method and never fails due
         * to overflow problems since the return value can be an instance of
         * the <code>Rectangle2D</code> that uses double precision values to
         * store the dimensions.
         *
         * <p>
         * Note that the <a href="{@docRoot}/java/awt/Shape.html#def_insideness">
         * definition of insideness</a> can lead to situations where points
         * on the defining outline of the {@code shape} may not be considered
         * contained in the returned {@code bounds} object, but only in cases
         * where those points are also not considered contained in the original
         * {@code shape}.
         * </p>
         * <p>
         * If a {@code point} is inside the {@code shape} according to the
         * {@link #contains(Point2D p) contains(point)} method, then it must
         * be inside the returned {@code Rectangle2D} bounds object according
         * to the {@link #contains(Point2D p) contains(point)} method of the
         * {@code bounds}. Specifically:
         * </p>
         * <p>
         * {@code shape.contains(p)} requires {@code bounds.contains(p)}
         * </p>
         * <p>
         * If a {@code point} is not inside the {@code shape}, then it might
         * still be contained in the {@code bounds} object:
         * </p>
         * <p>
         * {@code bounds.contains(p)} does not imply {@code shape.contains(p)}
         * </p>
         * @return {Rectangle2D} an instance of <code>Rectangle2D</code> that is a
         * high-precision bounding box of the <code>Shape</code>.
         * @see #getBounds
         * @since 1.2
         */
        getBounds2D(): Rectangle2D;
        contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
        /**
         * Tests if the interior of the <code>Shape</code> intersects the
         * interior of a specified rectangular area.
         * The rectangular area is considered to intersect the <code>Shape</code>
         * if any point is contained in both the interior of the
         * <code>Shape</code> and the specified rectangular area.
         * <p>
         * The {@code Shape.intersects()} method allows a {@code Shape}
         * implementation to conservatively return {@code true} when:
         * <ul>
         * <li>
         * there is a high probability that the rectangular area and the
         * <code>Shape</code> intersect, but
         * <li>
         * the calculations to accurately determine this intersection
         * are prohibitively expensive.
         * </ul>
         * This means that for some {@code Shapes} this method might
         * return {@code true} even though the rectangular area does not
         * intersect the {@code Shape}.
         * The {@link Area} class performs
         * more accurate computations of geometric intersection than most
         * {@code Shape} objects and therefore can be used if a more precise
         * answer is required.
         *
         * @param {number} x the X coordinate of the upper-left corner
         * of the specified rectangular area
         * @param {number} y the Y coordinate of the upper-left corner
         * of the specified rectangular area
         * @param {number} w the width of the specified rectangular area
         * @param {number} h the height of the specified rectangular area
         * @return {boolean} <code>true</code> if the interior of the <code>Shape</code> and
         * the interior of the rectangular area intersect, or are
         * both highly likely to intersect and intersection calculations
         * would be too expensive to perform; <code>false</code> otherwise.
         * @see java.awt.geom.Area
         * @since 1.2
         */
        intersects(x?: any, y?: any, w?: any, h?: any): any;
        /**
         * Returns an iterator object that iterates along the <code>Shape</code>
         * boundary and provides access to a flattened view of the
         * <code>Shape</code> outline geometry.
         * <p>
         * Only SEG_MOVETO, SEG_LINETO, and SEG_CLOSE point types are
         * returned by the iterator.
         * <p>
         * If an optional <code>AffineTransform</code> is specified,
         * the coordinates returned in the iteration are transformed
         * accordingly.
         * <p>
         * The amount of subdivision of the curved segments is controlled
         * by the <code>flatness</code> parameter, which specifies the
         * maximum distance that any point on the unflattened transformed
         * curve can deviate from the returned flattened path segments.
         * Note that a limit on the accuracy of the flattened path might be
         * silently imposed, causing very small flattening parameters to be
         * treated as larger values.  This limit, if there is one, is
         * defined by the particular implementation that is used.
         * <p>
         * Each call to this method returns a fresh <code>PathIterator</code>
         * object that traverses the <code>Shape</code> object geometry
         * independently from any other <code>PathIterator</code> objects in use at
         * the same time.
         * <p>
         * It is recommended, but not guaranteed, that objects
         * implementing the <code>Shape</code> interface isolate iterations
         * that are in process from any changes that might occur to the original
         * object's geometry during such iterations.
         *
         * @param {AffineTransform} at an optional <code>AffineTransform</code> to be applied to the
         * coordinates as they are returned in the iteration, or
         * <code>null</code> if untransformed coordinates are desired
         * @param {number} flatness the maximum distance that the line segments used to
         * approximate the curved segments are allowed to deviate
         * from any point on the original curve
         * @return {PathIterator} a new <code>PathIterator</code> that independently traverses
         * a flattened view of the geometry of the  <code>Shape</code>.
         * @since 1.2
         */
        getPathIterator(at?: any, flatness?: any): any;
    }
}
declare namespace javaemul.internal {
    /**
     * Wraps a native <code>char</code> as an object.
     *
     * TODO(jat): many of the classification methods implemented here are not
     * correct in that they only handle ASCII characters, and many other methods are
     * not currently implemented. I think the proper approach is to introduce * a
     * deferred binding parameter which substitutes an implementation using a
     * fully-correct Unicode character database, at the expense of additional data
     * being downloaded. That way developers that need the functionality can get it
     * without those who don't need it paying for it.
     *
     * <pre>
     * The following methods are still not implemented -- most would require Unicode
     * character db to be useful:
     * - digit / is* / to*(int codePoint)
     * - isDefined(char)
     * - isIdentifierIgnorable(char)
     * - isJavaIdentifierPart(char)
     * - isJavaIdentifierStart(char)
     * - isJavaLetter(char) -- deprecated, so probably not
     * - isJavaLetterOrDigit(char) -- deprecated, so probably not
     * - isISOControl(char)
     * - isMirrored(char)
     * - isSpaceChar(char)
     * - isTitleCase(char)
     * - isUnicodeIdentifierPart(char)
     * - isUnicodeIdentifierStart(char)
     * - getDirectionality(*)
     * - getNumericValue(*)
     * - getType(*)
     * - reverseBytes(char) -- any use for this at all in the browser?
     * - toTitleCase(*)
     * - all the category constants for classification
     *
     * The following do not properly handle characters outside of ASCII:
     * - digit(char c, int radix)
     * - isDigit(char c)
     * - isLetter(char c)
     * - isLetterOrDigit(char c)
     * - isLowerCase(char c)
     * - isUpperCase(char c)
     * </pre>
     */
    class CharacterHelper {
        static TYPE: any;
        static TYPE_$LI$(): any;
        static MIN_RADIX: number;
        static MAX_RADIX: number;
        static MIN_VALUE: string;
        static MAX_VALUE: string;
        static MIN_SURROGATE: string;
        static MAX_SURROGATE: string;
        static MIN_LOW_SURROGATE: string;
        static MAX_LOW_SURROGATE: string;
        static MIN_HIGH_SURROGATE: string;
        static MAX_HIGH_SURROGATE: string;
        static MIN_SUPPLEMENTARY_CODE_POINT: number;
        static MIN_CODE_POINT: number;
        static MAX_CODE_POINT: number;
        static SIZE: number;
        static charCount(codePoint: number): number;
        static codePointAt$char_A$int(a: string[], index: number): number;
        static codePointAt$char_A$int$int(a: string[], index: number, limit: number): number;
        static codePointAt(a?: any, index?: any, limit?: any): any;
        static codePointAt$java_lang_CharSequence$int(seq: string, index: number): number;
        static codePointBefore$char_A$int(a: string[], index: number): number;
        static codePointBefore$char_A$int$int(a: string[], index: number, start: number): number;
        static codePointBefore(a?: any, index?: any, start?: any): any;
        static codePointBefore$java_lang_CharSequence$int(cs: string, index: number): number;
        static codePointCount$char_A$int$int(a: string[], offset: number, count: number): number;
        static codePointCount(a?: any, offset?: any, count?: any): any;
        static codePointCount$java_lang_CharSequence$int$int(seq: string, beginIndex: number, endIndex: number): number;
        static compare(x: string, y: string): number;
        static digit(c: string, radix: number): number;
        static getNumericValue(ch: string): number;
        static forDigit$int$int(digit: number, radix: number): string;
        static forDigit(digit?: any, radix?: any): any;
        /**
         * @skip
         *
         * public for shared implementation with Arrays.hashCode
         * @param {string} c
         * @return {number}
         */
        static hashCode(c: string): number;
        static isDigit(c: string): boolean;
        static digitRegex(): RegExp;
        static isHighSurrogate(ch: string): boolean;
        static isLetter(c: string): boolean;
        static leterRegex(): RegExp;
        static isLetterOrDigit(c: string): boolean;
        static leterOrDigitRegex(): RegExp;
        static isLowerCase(c: string): boolean;
        static isLowSurrogate(ch: string): boolean;
        /**
         * Deprecated - see isWhitespace(char).
         * @param {string} c
         * @return {boolean}
         */
        static isSpace(c: string): boolean;
        static isWhitespace$char(ch: string): boolean;
        static isWhitespace(ch?: any): any;
        static isWhitespace$int(codePoint: number): boolean;
        static whitespaceRegex(): RegExp;
        static isSupplementaryCodePoint(codePoint: number): boolean;
        static isSurrogatePair(highSurrogate: string, lowSurrogate: string): boolean;
        static isUpperCase(c: string): boolean;
        static isValidCodePoint(codePoint: number): boolean;
        static offsetByCodePoints$char_A$int$int$int$int(a: string[], start: number, count: number, index: number, codePointOffset: number): number;
        static offsetByCodePoints(a?: any, start?: any, count?: any, index?: any, codePointOffset?: any): any;
        static offsetByCodePoints$java_lang_CharSequence$int$int(seq: string, index: number, codePointOffset: number): number;
        static toChars$int(codePoint: number): string[];
        static toChars$int$char_A$int(codePoint: number, dst: string[], dstIndex: number): number;
        static toChars(codePoint?: any, dst?: any, dstIndex?: any): any;
        static toCodePoint(highSurrogate: string, lowSurrogate: string): number;
        static toLowerCase$char(c: string): string;
        static toLowerCase(c?: any): any;
        static toLowerCase$int(c: number): number;
        static toString(x: string): string;
        static toUpperCase$char(c: string): string;
        static toUpperCase(c?: any): any;
        static toUpperCase$int(c: number): string;
        static valueOf(c: string): CharacterHelper;
        static codePointAt$java_lang_CharSequence$int$int(cs: string, index: number, limit: number): number;
        static codePointBefore$java_lang_CharSequence$int$int(cs: string, index: number, start: number): number;
        /**
         * Shared implementation with {@link LongHelper#toString}.
         *
         * @skip
         * @param {number} digit
         * @return {string}
         */
        static forDigit$int(digit: number): string;
        /**
         * Computes the high surrogate character of the UTF16 representation of a
         * non-BMP code point. See {@link getLowSurrogate}.
         *
         * @param {number} codePoint
         * requested codePoint, required to be >=
         * MIN_SUPPLEMENTARY_CODE_POINT
         * @return {string} high surrogate character
         */
        static getHighSurrogate(codePoint: number): string;
        /**
         * Computes the low surrogate character of the UTF16 representation of a
         * non-BMP code point. See {@link getHighSurrogate}.
         *
         * @param {number} codePoint
         * requested codePoint, required to be >=
         * MIN_SUPPLEMENTARY_CODE_POINT
         * @return {string} low surrogate character
         */
        static getLowSurrogate(codePoint: number): string;
        value: string;
        constructor(value: string);
        charValue(): string;
        compareTo(c: CharacterHelper): number;
        equals(o: any): boolean;
        toString(): string;
    }
    namespace CharacterHelper {
        /**
         * Use nested class to avoid clinit on outer.
         */
        class BoxedValues {
            static boxedValues: javaemul.internal.CharacterHelper[];
            static boxedValues_$LI$(): javaemul.internal.CharacterHelper[];
        }
    }
}
declare namespace javaemul.internal {
    class ExceptionHelper {
        constructor();
        static forInputString(s: string): Error;
        static forNullInputString(): Error;
        static forRadix(radix: number): Error;
    }
}
declare namespace javaemul.internal {
    /**
     * A utility class that provides utility functions to do precondition checks
     * inside GWT-SDK.
     */
    class InternalPreconditions {
        static CHECKED_MODE: boolean;
        static TYPE_CHECK: boolean;
        static API_CHECK: boolean;
        static BOUND_CHECK: boolean;
        static checkType(expression: boolean): void;
        static checkCriticalType(expression: boolean): void;
        /**
         * Ensures the truth of an expression that verifies array type.
         * @param {boolean} expression
         */
        static checkArrayType$boolean(expression: boolean): void;
        static checkCriticalArrayType$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression that verifies array type.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkArrayType$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression that verifies array type.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkArrayType(expression?: any, errorMessage?: any): any;
        static checkCriticalArrayType$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        static checkCriticalArrayType(expression?: any, errorMessage?: any): any;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * @param {boolean} expression
         */
        static checkElement$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         */
        static checkCriticalElement$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkElement$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkElement(expression?: any, errorMessage?: any): any;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkCriticalElement$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression involving existence of an element.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkCriticalElement(expression?: any, errorMessage?: any): any;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * @param {boolean} expression
         */
        static checkArgument$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         */
        static checkCriticalArgument$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkArgument$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkCriticalArgument$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * @param {boolean} expression
         * @param {string} errorMessageTemplate
         * @param {Array} errorMessageArgs
         */
        static checkArgument$boolean$java_lang_String$java_lang_Object_A(expression: boolean, errorMessageTemplate: string, ...errorMessageArgs: any[]): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * @param {boolean} expression
         * @param {string} errorMessageTemplate
         * @param {Array} errorMessageArgs
         */
        static checkArgument(expression?: any, errorMessageTemplate?: any, ...errorMessageArgs: any[]): any;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         * @param {string} errorMessageTemplate
         * @param {Array} errorMessageArgs
         */
        static checkCriticalArgument$boolean$java_lang_String$java_lang_Object_A(expression: boolean, errorMessageTemplate: string, ...errorMessageArgs: any[]): void;
        /**
         * Ensures the truth of an expression involving one or more parameters to the
         * calling method.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         * @param {string} errorMessageTemplate
         * @param {Array} errorMessageArgs
         */
        static checkCriticalArgument(expression?: any, errorMessageTemplate?: any, ...errorMessageArgs: any[]): any;
        /**
         * Ensures the truth of an expression involving the state of the calling
         * instance, but not involving any parameters to the calling method.
         *
         * @param {boolean} expression
         * a boolean expression
         * @throws IllegalStateException
         * if {@code expression} is false
         */
        static checkState$boolean(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving the state of the calling
         * instance, but not involving any parameters to the calling method.
         * <p>
         * For cases where failing fast is pretty important and not failing early
         * could cause bugs that are much harder to debug.
         * @param {boolean} expression
         */
        static checkCritcalState(expression: boolean): void;
        /**
         * Ensures the truth of an expression involving the state of the calling
         * instance, but not involving any parameters to the calling method.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkState$boolean$java_lang_Object(expression: boolean, errorMessage: any): void;
        /**
         * Ensures the truth of an expression involving the state of the calling
         * instance, but not involving any parameters to the calling method.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkState(expression?: any, errorMessage?: any): any;
        /**
         * Ensures the truth of an expression involving the state of the calling
         * instance, but not involving any parameters to the calling method.
         * @param {boolean} expression
         * @param {*} errorMessage
         */
        static checkCriticalState(expression: boolean, errorMessage: any): void;
        /**
         * Ensures that an object reference passed as a parameter to the calling
         * method is not null.
         * @param {*} reference
         * @return {*}
         */
        static checkNotNull$java_lang_Object<T>(reference: T): T;
        static checkCriticalNotNull$java_lang_Object<T>(reference: T): T;
        /**
         * Ensures that an object reference passed as a parameter to the calling
         * method is not null.
         * @param {*} reference
         * @param {*} errorMessage
         */
        static checkNotNull$java_lang_Object$java_lang_Object(reference: any, errorMessage: any): void;
        /**
         * Ensures that an object reference passed as a parameter to the calling
         * method is not null.
         * @param {*} reference
         * @param {*} errorMessage
         */
        static checkNotNull(reference?: any, errorMessage?: any): any;
        static checkCriticalNotNull$java_lang_Object$java_lang_Object(reference: any, errorMessage: any): void;
        static checkCriticalNotNull(reference?: any, errorMessage?: any): any;
        /**
         * Ensures that {@code size} specifies a valid array size (i.e. non-negative).
         * @param {number} size
         */
        static checkArraySize(size: number): void;
        static checkCriticalArraySize(size: number): void;
        /**
         * Ensures that {@code index} specifies a valid <i>element</i> in an array,
         * list or string of size {@code size}. An element index may range from zero,
         * inclusive, to {@code size}, exclusive.
         * @param {number} index
         * @param {number} size
         */
        static checkElementIndex(index: number, size: number): void;
        static checkCriticalElementIndex(index: number, size: number): void;
        /**
         * Ensures that {@code index} specifies a valid <i>position</i> in an array,
         * list or string of size {@code size}. A position index may range from zero
         * to {@code size}, inclusive.
         * @param {number} index
         * @param {number} size
         */
        static checkPositionIndex(index: number, size: number): void;
        static checkCriticalPositionIndex(index: number, size: number): void;
        /**
         * Ensures that {@code start} and {@code end} specify a valid <i>positions</i>
         * in an array, list or string of size {@code size}, and are in order. A
         * position index may range from zero to {@code size}, inclusive.
         * @param {number} start
         * @param {number} end
         * @param {number} size
         */
        static checkPositionIndexes(start: number, end: number, size: number): void;
        /**
         * Ensures that {@code start} and {@code end} specify a valid <i>positions</i>
         * in an array, list or string of size {@code size}, and are in order. A
         * position index may range from zero to {@code size}, inclusive.
         * @param {number} start
         * @param {number} end
         * @param {number} size
         */
        static checkCriticalPositionIndexes(start: number, end: number, size: number): void;
        /**
         * Checks that bounds are correct.
         *
         * @throw StringIndexOutOfBoundsException if the range is not legal
         * @param {number} start
         * @param {number} end
         * @param {number} size
         */
        static checkStringBounds(start: number, end: number, size: number): void;
        /**
         * Substitutes each {@code %s} in {@code template} with an argument. These are
         * matched by position: the first {@code %s} gets {@code args[0]}, etc. If
         * there are more arguments than placeholders, the unmatched arguments will be
         * appended to the end of the formatted message in square braces.
         * @param {string} template
         * @param {Array} args
         * @return {string}
         * @private
         */
        private static format(template, ...args);
        constructor();
    }
}
declare namespace javaemul.internal {
    /**
     * Math utility methods and constants.
     */
    class MathHelper {
        static EPSILON: number;
        static EPSILON_$LI$(): number;
        static MAX_VALUE: number;
        static MAX_VALUE_$LI$(): number;
        static MIN_VALUE: number;
        static MIN_VALUE_$LI$(): number;
        static nextDown(x: number): number;
        static ulp(x: number): number;
        static nextUp(x: number): number;
        static E: number;
        static PI: number;
        static PI_OVER_180: number;
        static PI_OVER_180_$LI$(): number;
        static PI_UNDER_180: number;
        static PI_UNDER_180_$LI$(): number;
        static abs$double(x: number): number;
        static abs$float(x: number): number;
        static abs$int(x: number): number;
        static abs(x?: any): any;
        static abs$long(x: number): number;
        static acos(x: number): number;
        static asin(x: number): number;
        static atan(x: number): number;
        static atan2(y: number, x: number): number;
        static cbrt(x: number): number;
        static ceil(x: number): number;
        static copySign$double$double(magnitude: number, sign: number): number;
        static copySign$float$float(magnitude: number, sign: number): number;
        static copySign(magnitude?: any, sign?: any): any;
        static cos(x: number): number;
        static cosh(x: number): number;
        static exp(x: number): number;
        static expm1(d: number): number;
        static floor(x: number): number;
        static hypot(x: number, y: number): number;
        static log(x: number): number;
        static log10(x: number): number;
        static log1p(x: number): number;
        static max$double$double(x: number, y: number): number;
        static max$float$float(x: number, y: number): number;
        static max$int$int(x: number, y: number): number;
        static max(x?: any, y?: any): any;
        static max$long$long(x: number, y: number): number;
        static min$double$double(x: number, y: number): number;
        static min$float$float(x: number, y: number): number;
        static min$int$int(x: number, y: number): number;
        static min(x?: any, y?: any): any;
        static min$long$long(x: number, y: number): number;
        static pow(x: number, exp: number): number;
        static random(): number;
        static rint(d: number): number;
        static round$double(x: number): number;
        static round$float(x: number): number;
        static round(x?: any): any;
        private static unsafeCastToInt(d);
        static scalb$double$int(d: number, scaleFactor: number): number;
        static scalb$float$int(f: number, scaleFactor: number): number;
        static scalb(f?: any, scaleFactor?: any): any;
        static signum$double(d: number): number;
        static signum$float(f: number): number;
        static signum(f?: any): any;
        static sin(x: number): number;
        static sinh(x: number): number;
        static sqrt(x: number): number;
        static tan(x: number): number;
        static tanh(x: number): number;
        static toDegrees(x: number): number;
        static toRadians(x: number): number;
        static IEEEremainder(f1: number, f2: number): number;
    }
}
declare namespace javaemul.internal {
    /**
     * Abstract base class for numeric wrapper classes.
     */
    abstract class NumberHelper {
        /**
         * Stores a regular expression object to verify the format of float values.
         */
        static floatRegex: RegExp;
        /**
         * @skip
         *
         * This function will determine the radix that the string is expressed
         * in based on the parsing rules defined in the Javadocs for
         * Integer.decode() and invoke __parseAndValidateInt.
         * @param {string} s
         * @param {number} lowerBound
         * @param {number} upperBound
         * @return {number}
         */
        static __decodeAndValidateInt(s: string, lowerBound: number, upperBound: number): number;
        static __decodeNumberString(s: string): NumberHelper.__Decode;
        /**
         * @skip
         *
         * This function contains common logic for parsing a String as a
         * floating- point number and validating the range.
         * @param {string} s
         * @return {number}
         */
        static __parseAndValidateDouble(s: string): number;
        /**
         * @skip
         *
         * This function contains common logic for parsing a String in a given
         * radix and validating the result.
         * @param {string} s
         * @param {number} radix
         * @param {number} lowerBound
         * @param {number} upperBound
         * @return {number}
         */
        static __parseAndValidateInt(s: string, radix: number, lowerBound: number, upperBound: number): number;
        /**
         * @skip
         *
         * This function contains common logic for parsing a String in a given
         * radix and validating the result.
         * @param {string} s
         * @param {number} radix
         * @return {number}
         */
        static __parseAndValidateLong(s: string, radix: number): number;
        /**
         * @skip
         *
         * @param {string} str
         * @return {boolean} {@code true} if the string matches the float format, {@code false}
         * otherwise
         * @private
         */
        static __isValidDouble(str: string): boolean;
        static createFloatRegex(): RegExp;
        constructor();
    }
    namespace NumberHelper {
        class __Decode {
            payload: string;
            radix: number;
            constructor(radix: number, payload: string);
        }
        /**
         * Use nested class to avoid clinit on outer.
         */
        class __ParseLong {
            static __static_initialized: boolean;
            static __static_initialize(): void;
            /**
             * The number of digits (excluding minus sign and leading zeros) to process
             * at a time. The largest value expressible in maxDigits digits as well as
             * the factor radix^maxDigits must be strictly less than 2^31.
             */
            static maxDigitsForRadix: number[];
            static maxDigitsForRadix_$LI$(): number[];
            /**
             * A table of values radix*maxDigitsForRadix[radix].
             */
            static maxDigitsRadixPower: number[];
            static maxDigitsRadixPower_$LI$(): number[];
            /**
             * The largest number of digits (excluding minus sign and leading zeros)
             * that can fit into a long for a given radix between 2 and 36, inclusive.
             */
            static maxLengthForRadix: number[];
            static maxLengthForRadix_$LI$(): number[];
            /**
             * A table of floor(MAX_VALUE / maxDigitsRadixPower).
             */
            static maxValueForRadix: number[];
            static maxValueForRadix_$LI$(): number[];
            static __static_initializer_0(): void;
        }
    }
}
declare namespace sun.awt.geom {
    class ChainEnd {
        head: sun.awt.geom.CurveLink;
        tail: sun.awt.geom.CurveLink;
        partner: ChainEnd;
        etag: number;
        constructor(first: sun.awt.geom.CurveLink, partner: ChainEnd);
        getChain(): sun.awt.geom.CurveLink;
        setOtherEnd(partner: ChainEnd): void;
        getPartner(): ChainEnd;
        linkTo(that: ChainEnd): sun.awt.geom.CurveLink;
        addLink(newlink: sun.awt.geom.CurveLink): void;
        getX(): number;
    }
}
declare namespace sun.awt.geom {
    abstract class Crossings {
        static debug: boolean;
        limit: number;
        yranges: number[];
        xlo: number;
        ylo: number;
        xhi: number;
        yhi: number;
        constructor(xlo: number, ylo: number, xhi: number, yhi: number);
        getXLo(): number;
        getYLo(): number;
        getXHi(): number;
        getYHi(): number;
        abstract record(ystart: number, yend: number, direction: number): any;
        print(): void;
        isEmpty(): boolean;
        abstract covers(ystart: number, yend: number): boolean;
        static findCrossings$java_util_Vector$double$double$double$double(curves: Array<any>, xlo: number, ylo: number, xhi: number, yhi: number): Crossings;
        static findCrossings(curves?: any, xlo?: any, ylo?: any, xhi?: any, yhi?: any): any;
        static findCrossings$java_awt_geom_PathIterator$double$double$double$double(pi: PathIterator, xlo: number, ylo: number, xhi: number, yhi: number): Crossings;
        accumulateLine$double$double$double$double(x0: number, y0: number, x1: number, y1: number): boolean;
        accumulateLine$double$double$double$double$int(x0: number, y0: number, x1: number, y1: number, direction: number): boolean;
        accumulateLine(x0?: any, y0?: any, x1?: any, y1?: any, direction?: any): any;
        tmp: Array<any>;
        accumulateQuad(x0: number, y0: number, coords: number[]): boolean;
        accumulateCubic(x0: number, y0: number, coords: number[]): boolean;
    }
    namespace Crossings {
        class EvenOdd extends sun.awt.geom.Crossings {
            constructor(xlo: number, ylo: number, xhi: number, yhi: number);
            covers(ystart: number, yend: number): boolean;
            record(ystart: number, yend: number, direction: number): void;
        }
        class NonZero extends sun.awt.geom.Crossings {
            crosscounts: number[];
            constructor(xlo: number, ylo: number, xhi: number, yhi: number);
            covers(ystart: number, yend: number): boolean;
            remove(cur: number): void;
            insert(cur: number, lo: number, hi: number, dir: number): void;
            record(ystart: number, yend: number, direction: number): void;
        }
    }
}
declare namespace sun.awt.geom {
    abstract class Curve {
        static INCREASING: number;
        static DECREASING: number;
        direction: number;
        static insertMove(curves: Array<any>, x: number, y: number): void;
        static insertLine(curves: Array<any>, x0: number, y0: number, x1: number, y1: number): void;
        static insertQuad(curves: Array<any>, x0: number, y0: number, coords: number[]): void;
        static insertCubic(curves: Array<any>, x0: number, y0: number, coords: number[]): void;
        /**
         * Calculates the number of times the given path crosses the ray extending
         * to the right from (px,py). If the point lies on a part of the path, then
         * no crossings are counted for that intersection. +1 is added for each
         * crossing where the Y coordinate is increasing -1 is added for each
         * crossing where the Y coordinate is decreasing The return value is the sum
         * of all crossings for every segment in the path. The path must start with
         * a SEG_MOVETO, otherwise an exception is thrown. The caller must check
         * p[xy] for NaN values. The caller may also reject infinite p[xy] values as
         * well.
         * @param {PathIterator} pi
         * @param {number} px
         * @param {number} py
         * @return {number}
         */
        static pointCrossingsForPath(pi: PathIterator, px: number, py: number): number;
        /**
         * Calculates the number of times the line from (x0,y0) to (x1,y1) crosses
         * the ray extending to the right from (px,py). If the point lies on the
         * line, then no crossings are recorded. +1 is returned for a crossing where
         * the Y coordinate is increasing -1 is returned for a crossing where the Y
         * coordinate is decreasing
         * @param {number} px
         * @param {number} py
         * @param {number} x0
         * @param {number} y0
         * @param {number} x1
         * @param {number} y1
         * @return {number}
         */
        static pointCrossingsForLine(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number;
        /**
         * Calculates the number of times the quad from (x0,y0) to (x1,y1) crosses
         * the ray extending to the right from (px,py). If the point lies on a part
         * of the curve, then no crossings are counted for that intersection. the
         * level parameter should be 0 at the top-level call and will count up for
         * each recursion level to prevent infinite recursion +1 is added for each
         * crossing where the Y coordinate is increasing -1 is added for each
         * crossing where the Y coordinate is decreasing
         * @param {number} px
         * @param {number} py
         * @param {number} x0
         * @param {number} y0
         * @param {number} xc
         * @param {number} yc
         * @param {number} x1
         * @param {number} y1
         * @param {number} level
         * @return {number}
         */
        static pointCrossingsForQuad(px: number, py: number, x0: number, y0: number, xc: number, yc: number, x1: number, y1: number, level: number): number;
        /**
         * Calculates the number of times the cubic from (x0,y0) to (x1,y1) crosses
         * the ray extending to the right from (px,py). If the point lies on a part
         * of the curve, then no crossings are counted for that intersection. the
         * level parameter should be 0 at the top-level call and will count up for
         * each recursion level to prevent infinite recursion +1 is added for each
         * crossing where the Y coordinate is increasing -1 is added for each
         * crossing where the Y coordinate is decreasing
         * @param {number} px
         * @param {number} py
         * @param {number} x0
         * @param {number} y0
         * @param {number} xc0
         * @param {number} yc0
         * @param {number} xc1
         * @param {number} yc1
         * @param {number} x1
         * @param {number} y1
         * @param {number} level
         * @return {number}
         */
        static pointCrossingsForCubic(px: number, py: number, x0: number, y0: number, xc0: number, yc0: number, xc1: number, yc1: number, x1: number, y1: number, level: number): number;
        /**
         * The rectangle intersection test counts the number of times that the path
         * crosses through the shadow that the rectangle projects to the right
         * towards (x => +INFINITY).
         *
         * During processing of the path it actually counts every time the path
         * crosses either or both of the top and bottom edges of that shadow. If the
         * path enters from the top, the count is incremented. If it then exits back
         * through the top, the same way it came in, the count is decremented and
         * there is no impact on the winding count. If, instead, the path exits out
         * the bottom, then the count is incremented again and a full pass through
         * the shadow is indicated by the winding count having been incremented by
         * 2.
         *
         * Thus, the winding count that it accumulates is actually double the real
         * winding count. Since the path is continuous, the final answer should be a
         * multiple of 2, otherwise there is a logic error somewhere.
         *
         * If the path ever has a direct hit on the rectangle, then a special value
         * is returned. This special value terminates all ongoing accumulation on up
         * through the call chain and ends up getting returned to the calling
         * function which can then produce an answer directly. For intersection
         * tests, the answer is always "true" if the path intersects the rectangle.
         * For containment tests, the answer is always "false" if the path
         * intersects the rectangle. Thus, no further processing is ever needed if
         * an intersection occurs.
         */
        static RECT_INTERSECTS: number;
        /**
         * Accumulate the number of times the path crosses the shadow extending to
         * the right of the rectangle. See the comment for the RECT_INTERSECTS
         * constant for more complete details. The return value is the sum of all
         * crossings for both the top and bottom of the shadow for every segment in
         * the path, or the special value RECT_INTERSECTS if the path ever enters
         * the interior of the rectangle. The path must start with a SEG_MOVETO,
         * otherwise an exception is thrown. The caller must check r[xy]{min,max}
         * for NaN values.
         * @param {PathIterator} pi
         * @param {number} rxmin
         * @param {number} rymin
         * @param {number} rxmax
         * @param {number} rymax
         * @return {number}
         */
        static rectCrossingsForPath(pi: PathIterator, rxmin: number, rymin: number, rxmax: number, rymax: number): number;
        /**
         * Accumulate the number of times the line crosses the shadow extending to
         * the right of the rectangle. See the comment for the RECT_INTERSECTS
         * constant for more complete details.
         * @param {number} crossings
         * @param {number} rxmin
         * @param {number} rymin
         * @param {number} rxmax
         * @param {number} rymax
         * @param {number} x0
         * @param {number} y0
         * @param {number} x1
         * @param {number} y1
         * @return {number}
         */
        static rectCrossingsForLine(crossings: number, rxmin: number, rymin: number, rxmax: number, rymax: number, x0: number, y0: number, x1: number, y1: number): number;
        /**
         * Accumulate the number of times the quad crosses the shadow extending to
         * the right of the rectangle. See the comment for the RECT_INTERSECTS
         * constant for more complete details.
         * @param {number} crossings
         * @param {number} rxmin
         * @param {number} rymin
         * @param {number} rxmax
         * @param {number} rymax
         * @param {number} x0
         * @param {number} y0
         * @param {number} xc
         * @param {number} yc
         * @param {number} x1
         * @param {number} y1
         * @param {number} level
         * @return {number}
         */
        static rectCrossingsForQuad(crossings: number, rxmin: number, rymin: number, rxmax: number, rymax: number, x0: number, y0: number, xc: number, yc: number, x1: number, y1: number, level: number): number;
        /**
         * Accumulate the number of times the cubic crosses the shadow extending to
         * the right of the rectangle. See the comment for the RECT_INTERSECTS
         * constant for more complete details.
         * @param {number} crossings
         * @param {number} rxmin
         * @param {number} rymin
         * @param {number} rxmax
         * @param {number} rymax
         * @param {number} x0
         * @param {number} y0
         * @param {number} xc0
         * @param {number} yc0
         * @param {number} xc1
         * @param {number} yc1
         * @param {number} x1
         * @param {number} y1
         * @param {number} level
         * @return {number}
         */
        static rectCrossingsForCubic(crossings: number, rxmin: number, rymin: number, rxmax: number, rymax: number, x0: number, y0: number, xc0: number, yc0: number, xc1: number, yc1: number, x1: number, y1: number, level: number): number;
        constructor(direction: number);
        getDirection(): number;
        getWithDirection(direction: number): Curve;
        static round(v: number): number;
        static orderof(x1: number, x2: number): number;
        static signeddiffbits(y1: number, y2: number): number;
        static diffbits(y1: number, y2: number): number;
        static prev(v: number): number;
        static next(v: number): number;
        toString(): string;
        controlPointString(): string;
        abstract getOrder(): number;
        abstract getXTop(): number;
        abstract getYTop(): number;
        abstract getXBot(): number;
        abstract getYBot(): number;
        abstract getXMin(): number;
        abstract getXMax(): number;
        abstract getX0(): number;
        abstract getY0(): number;
        abstract getX1(): number;
        abstract getY1(): number;
        abstract XforY(y: number): number;
        abstract TforY(y: number): number;
        abstract XforT(t: number): number;
        abstract YforT(t: number): number;
        abstract dXforT(t: number, deriv: number): number;
        abstract dYforT(t: number, deriv: number): number;
        abstract nextVertical(t0: number, t1: number): number;
        crossingsFor(x: number, y: number): number;
        accumulateCrossings(c: sun.awt.geom.Crossings): boolean;
        abstract enlarge(r: Rectangle2D): any;
        getSubCurve$double$double(ystart: number, yend: number): Curve;
        abstract getReversedCurve(): Curve;
        getSubCurve$double$double$int(ystart: number, yend: number, dir: number): Curve;
        getSubCurve(ystart?: any, yend?: any, dir?: any): any;
        compareTo(that: Curve, yrange: number[]): number;
        static TMIN: number;
        findIntersect(that: Curve, yrange: number[], ymin: number, slevel: number, tlevel: number, s0: number, xs0: number, ys0: number, s1: number, xs1: number, ys1: number, t0: number, xt0: number, yt0: number, t1: number, xt1: number, yt1: number): boolean;
        refineTforY(t0: number, yt0: number, y0: number): number;
        fairlyClose(v1: number, v2: number): boolean;
        abstract getSegment(coords: number[]): number;
    }
}
declare namespace sun.awt.geom {
    class CurveLink {
        curve: sun.awt.geom.Curve;
        ytop: number;
        ybot: number;
        etag: number;
        next: CurveLink;
        constructor(curve: sun.awt.geom.Curve, ystart: number, yend: number, etag: number);
        absorb$sun_awt_geom_CurveLink(link: CurveLink): boolean;
        absorb$sun_awt_geom_Curve$double$double$int(curve: sun.awt.geom.Curve, ystart: number, yend: number, etag: number): boolean;
        absorb(curve?: any, ystart?: any, yend?: any, etag?: any): any;
        isEmpty(): boolean;
        getCurve(): sun.awt.geom.Curve;
        getSubCurve(): sun.awt.geom.Curve;
        getMoveto(): sun.awt.geom.Curve;
        getXTop(): number;
        getYTop(): number;
        getXBot(): number;
        getYBot(): number;
        getX(): number;
        getEdgeTag(): number;
        setNext(link: CurveLink): void;
        getNext(): CurveLink;
    }
}
declare namespace sun.awt.geom {
    class Edge {
        static INIT_PARTS: number;
        static GROW_PARTS: number;
        curve: sun.awt.geom.Curve;
        ctag: number;
        etag: number;
        activey: number;
        equivalence: number;
        constructor(c?: any, ctag?: any, etag?: any);
        getCurve(): sun.awt.geom.Curve;
        getCurveTag(): number;
        getEdgeTag(): number;
        setEdgeTag(etag: number): void;
        getEquivalence(): number;
        setEquivalence(eq: number): void;
        lastEdge: Edge;
        lastResult: number;
        lastLimit: number;
        compareTo(other: Edge, yrange: number[]): number;
        record(yend: number, etag: number): void;
        isActiveFor(y: number, etag: number): boolean;
        toString(): string;
    }
}
declare namespace sun.awt.geom {
    interface PathConsumer2D {
        /**
         * @see java.awt.geom.Path2D.Float.moveTo
         * @param {number} x
         * @param {number} y
         */
        moveTo(x: number, y: number): any;
        /**
         * @see java.awt.geom.Path2D.Float.lineTo
         * @param {number} x
         * @param {number} y
         */
        lineTo(x: number, y: number): any;
        /**
         * @see java.awt.geom.Path2D.Float.quadTo
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        quadTo(x1: number, y1: number, x2: number, y2: number): any;
        /**
         * @see java.awt.geom.Path2D.Float.curveTo
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         * @param {number} x3
         * @param {number} y3
         */
        curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): any;
        /**
         * @see java.awt.geom.Path2D.Float.closePath
         */
        closePath(): any;
        /**
         * Called after the last segment of the last subpath when the iteration of
         * the path segments is completely done. This method serves to trigger the
         * end of path processing in the consumer that would normally be triggered
         * when a {@link PathIterator} returns
         * {@code true} from its {@code done} method.
         */
        pathDone(): any;
        /**
         * If a given PathConsumer performs all or most of its work natively then it
         * can return a (non-zero) pointer to a native function vector that defines
         * C functions for all of the above methods. The specific pointer it returns
         * is a pointer to a PathConsumerVec structure as defined in the include
         * file src/share/native/sun/java2d/pipe/PathConsumer2D.h
         *
         * @return {number} a native pointer to a PathConsumerVec structure.
         */
        getNativeConsumer(): number;
    }
}
/**
 * Constructs a new {@code Path2D} object from the given specified initial
 * values. This method is only intended for internal use and should not be
 * made public if the other constructors for this class are ever exposed.
 *
 * @param {number} rule
 * the winding rule
 * @param {number} initialTypes
 * the size to make the initial array to store the path segment
 * types
 * @since 1.6
 * @class
 */
declare abstract class Path2D implements java.awt.Shape {
    abstract getBounds2D(): any;
    /**
     * An even-odd winding rule for determining the interior of a path.
     *
     * @see PathIterator#WIND_EVEN_ODD
     * @since 1.6
     */
    static WIND_EVEN_ODD: number;
    static WIND_EVEN_ODD_$LI$(): number;
    /**
     * A non-zero winding rule for determining the interior of a path.
     *
     * @see PathIterator#WIND_NON_ZERO
     * @since 1.6
     */
    static WIND_NON_ZERO: number;
    static WIND_NON_ZERO_$LI$(): number;
    static SEG_MOVETO: number;
    static SEG_MOVETO_$LI$(): number;
    static SEG_LINETO: number;
    static SEG_LINETO_$LI$(): number;
    static SEG_QUADTO: number;
    static SEG_QUADTO_$LI$(): number;
    static SEG_CUBICTO: number;
    static SEG_CUBICTO_$LI$(): number;
    static SEG_CLOSE: number;
    static SEG_CLOSE_$LI$(): number;
    pointTypes: number[];
    numTypes: number;
    numCoords: number;
    windingRule: number;
    static INIT_SIZE: number;
    static EXPAND_MAX: number;
    constructor(rule?: any, initialTypes?: any);
    abstract cloneCoordsFloat(at: AffineTransform): number[];
    abstract cloneCoordsDouble(at: AffineTransform): number[];
    append$float$float(x: number, y: number): void;
    append$double$double(x: number, y: number): void;
    abstract getPoint(coordindex: number): Point2D;
    abstract needRoom(needMove: boolean, newCoords: number): any;
    abstract pointCrossings(px: number, py: number): number;
    abstract rectCrossings(rxmin: number, rymin: number, rxmax: number, rymax: number): number;
    /**
     * Adds a point to the path by moving to the specified coordinates
     * specified in float precision.
     * <p>
     * This method provides a single precision variant of the double
     * precision {@code moveTo()} method on the base {@code Path2D} class.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @see Path2D#moveTo
     * @since 1.6
     */
    moveTo(x?: any, y?: any): any;
    /**
     * Adds a point to the path by moving to the specified coordinates specified
     * in double precision.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @since 1.6
     */
    moveTo$double$double(x: number, y: number): void;
    /**
     * Adds a point to the path by drawing a straight line from the current
     * coordinates to the new specified coordinates specified in float
     * precision.
     * <p>
     * This method provides a single precision variant of the double
     * precision {@code lineTo()} method on the base {@code Path2D} class.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @see Path2D#lineTo
     * @since 1.6
     */
    lineTo(x?: any, y?: any): any;
    /**
     * Adds a point to the path by drawing a straight line from the current
     * coordinates to the new specified coordinates specified in double
     * precision.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @since 1.6
     */
    lineTo$double$double(x: number, y: number): void;
    /**
     * Adds a curved segment, defined by two new points, to the path by
     * drawing a Quadratic curve that intersects both the current
     * coordinates and the specified coordinates {@code (x2,y2)}, using the
     * specified point {@code (x1,y1)} as a quadratic parametric control
     * point. All coordinates are specified in float precision.
     * <p>
     * This method provides a single precision variant of the double
     * precision {@code quadTo()} method on the base {@code Path2D} class.
     *
     * @param {number} x1
     * the X coordinate of the quadratic control point
     * @param {number} y1
     * the Y coordinate of the quadratic control point
     * @param {number} x2
     * the X coordinate of the final end point
     * @param {number} y2
     * the Y coordinate of the final end point
     * @see Path2D#quadTo
     * @since 1.6
     */
    quadTo(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Adds a curved segment, defined by two new points, to the path by drawing
     * a Quadratic curve that intersects both the current coordinates and the
     * specified coordinates {@code (x2,y2)}, using the specified point
     * {@code (x1,y1)} as a quadratic parametric control point. All coordinates
     * are specified in double precision.
     *
     * @param {number} x1
     * the X coordinate of the quadratic control point
     * @param {number} y1
     * the Y coordinate of the quadratic control point
     * @param {number} x2
     * the X coordinate of the final end point
     * @param {number} y2
     * the Y coordinate of the final end point
     * @since 1.6
     */
    quadTo$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Adds a curved segment, defined by three new points, to the path by
     * drawing a B&eacute;zier curve that intersects both the current
     * coordinates and the specified coordinates {@code (x3,y3)}, using the
     * specified points {@code (x1,y1)} and {@code (x2,y2)} as B&eacute;zier
     * control points. All coordinates are specified in float precision.
     * <p>
     * This method provides a single precision variant of the double
     * precision {@code curveTo()} method on the base {@code Path2D} class.
     *
     * @param {number} x1
     * the X coordinate of the first B&eacute;zier control point
     * @param {number} y1
     * the Y coordinate of the first B&eacute;zier control point
     * @param {number} x2
     * the X coordinate of the second B&eacute;zier control point
     * @param {number} y2
     * the Y coordinate of the second B&eacute;zier control point
     * @param {number} x3
     * the X coordinate of the final end point
     * @param {number} y3
     * the Y coordinate of the final end point
     * @see Path2D#curveTo
     * @since 1.6
     */
    curveTo(x1?: any, y1?: any, x2?: any, y2?: any, x3?: any, y3?: any): any;
    /**
     * Adds a curved segment, defined by three new points, to the path by
     * drawing a B&eacute;zier curve that intersects both the current
     * coordinates and the specified coordinates {@code (x3,y3)}, using the
     * specified points {@code (x1,y1)} and {@code (x2,y2)} as B&eacute;zier
     * control points. All coordinates are specified in double precision.
     *
     * @param {number} x1
     * the X coordinate of the first B&eacute;zier control point
     * @param {number} y1
     * the Y coordinate of the first B&eacute;zier control point
     * @param {number} x2
     * the X coordinate of the second B&eacute;zier control point
     * @param {number} y2
     * the Y coordinate of the second B&eacute;zier control point
     * @param {number} x3
     * the X coordinate of the final end point
     * @param {number} y3
     * the Y coordinate of the final end point
     * @since 1.6
     */
    curveTo$double$double$double$double$double$double(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
    /**
     * Closes the current subpath by drawing a straight line back to the
     * coordinates of the last {@code moveTo}. If the path is already closed
     * then this method has no effect.
     *
     * @since 1.6
     */
    closePath(): void;
    /**
     * Appends the geometry of the specified {@code Shape} object to the path,
     * possibly connecting the new geometry to the existing path segments with a
     * line segment. If the {@code connect} parameter is {@code true} and the
     * path is not empty then any initial {@code moveTo} in the geometry of the
     * appended {@code Shape} is turned into a {@code lineTo} segment. If the
     * destination coordinates of such a connecting {@code lineTo} segment match
     * the ending coordinates of a currently open subpath then the segment is
     * omitted as superfluous. The winding rule of the specified {@code Shape}
     * is ignored and the appended geometry is governed by the winding rule
     * specified for this path.
     *
     * @param {java.awt.Shape} s
     * the {@code Shape} whose geometry is appended to this path
     * @param {boolean} connect
     * a boolean to control whether or not to turn an initial
     * {@code moveTo} segment into a {@code lineTo} segment to
     * connect the new geometry to the existing path
     * @since 1.6
     */
    append$java_awt_Shape$boolean(s: java.awt.Shape, connect: boolean): void;
    /**
     * Appends the geometry of the specified {@code Shape} object to the path,
     * possibly connecting the new geometry to the existing path segments with a
     * line segment. If the {@code connect} parameter is {@code true} and the
     * path is not empty then any initial {@code moveTo} in the geometry of the
     * appended {@code Shape} is turned into a {@code lineTo} segment. If the
     * destination coordinates of such a connecting {@code lineTo} segment match
     * the ending coordinates of a currently open subpath then the segment is
     * omitted as superfluous. The winding rule of the specified {@code Shape}
     * is ignored and the appended geometry is governed by the winding rule
     * specified for this path.
     *
     * @param {java.awt.Shape} s
     * the {@code Shape} whose geometry is appended to this path
     * @param {boolean} connect
     * a boolean to control whether or not to turn an initial
     * {@code moveTo} segment into a {@code lineTo} segment to
     * connect the new geometry to the existing path
     * @since 1.6
     */
    append(s?: any, connect?: any): any;
    /**
     * Appends the geometry of the specified {@link PathIterator} object to the
     * path, possibly connecting the new geometry to the existing path segments
     * with a line segment. If the {@code connect} parameter is {@code true} and
     * the path is not empty then any initial {@code moveTo} in the geometry of
     * the appended {@code Shape} is turned into a {@code lineTo} segment. If
     * the destination coordinates of such a connecting {@code lineTo} segment
     * match the ending coordinates of a currently open subpath then the segment
     * is omitted as superfluous. The winding rule of the specified
     * {@code Shape} is ignored and the appended geometry is governed by the
     * winding rule specified for this path.
     *
     * @param {PathIterator} pi
     * the {@code PathIterator} whose geometry is appended to this
     * path
     * @param {boolean} connect
     * a boolean to control whether or not to turn an initial
     * {@code moveTo} segment into a {@code lineTo} segment to
     * connect the new geometry to the existing path
     * @since 1.6
     */
    append$java_awt_geom_PathIterator$boolean(pi: PathIterator, connect: boolean): void;
    /**
     * Returns the fill style winding rule.
     *
     * @return {number} an integer representing the current winding rule.
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @see #setWindingRule
     * @since 1.6
     */
    getWindingRule(): number;
    /**
     * Sets the winding rule for this path to the specified value.
     *
     * @param {number} rule
     * an integer representing the specified winding rule
     * @exception IllegalArgumentException
     * if {@code rule} is not either {@link #WIND_EVEN_ODD} or
     * {@link #WIND_NON_ZERO}
     * @see #getWindingRule
     * @since 1.6
     */
    setWindingRule(rule: number): void;
    /**
     * Returns the coordinates most recently added to the end of the path as a
     * {@link Point2D} object.
     *
     * @return {Point2D} a {@code Point2D} object containing the ending coordinates of the
     * path or {@code null} if there are no points in the path.
     * @since 1.6
     */
    getCurrentPoint(): Point2D;
    /**
     * Resets the path to empty. The append position is set back to the
     * beginning of the path and all coordinates and point types are forgotten.
     *
     * @since 1.6
     */
    reset(): void;
    /**
     * Transforms the geometry of this path using the specified
     * {@link AffineTransform}. The geometry is transformed in place, which
     * permanently changes the boundary defined by this object.
     *
     * @param {AffineTransform} at
     * the {@code AffineTransform} used to transform the area
     * @since 1.6
     */
    abstract transform(at: AffineTransform): any;
    /**
     * Returns a new {@code Shape} representing a transformed version of this
     * {@code Path2D}. Note that the exact type and coordinate precision of the
     * return value is not specified for this method. The method will return a
     * Shape that contains no less precision for the transformed geometry than
     * this {@code Path2D} currently maintains, but it may contain no more
     * precision either. If the tradeoff of precision vs. storage size in the
     * result is important then the convenience constructors in the
     * {@link Path2D.Float#Path2D.Float(Shape, AffineTransform) Path2D.Float}
     * and {@link Path2D.Double#Path2D.Double(Shape, AffineTransform)
     * Path2D.Double} subclasses should be used to make the choice explicit.
     *
     * @param {AffineTransform} at
     * the {@code AffineTransform} used to transform a new
     * {@code Shape}.
     * @return {java.awt.Shape} a new {@code Shape}, transformed with the specified
     * {@code AffineTransform}.
     * @since 1.6
     */
    createTransformedShape(at: AffineTransform): java.awt.Shape;
    /**
     * Tests if the specified coordinates are inside the closed boundary of the
     * specified {@link PathIterator}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#contains(double, double)} method.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @return {boolean} {@code true} if the specified coordinates are inside the
     * specified {@code PathIterator}; {@code false} otherwise
     * @since 1.6
     */
    static contains$java_awt_geom_PathIterator$double$double(pi: PathIterator, x: number, y: number): boolean;
    /**
     * Tests if the specified {@link Point2D} is inside the closed boundary of
     * the specified {@link PathIterator}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#contains(Point2D)} method.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {Point2D} p
     * the specified {@code Point2D}
     * @return {boolean} {@code true} if the specified coordinates are inside the
     * specified {@code PathIterator}; {@code false} otherwise
     * @since 1.6
     */
    static contains$java_awt_geom_PathIterator$java_awt_geom_Point2D(pi: PathIterator, p: Point2D): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.6
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.6
     * @param {Point2D} p
     * @return {boolean}
     */
    contains$java_awt_geom_Point2D(p: Point2D): boolean;
    /**
     * Tests if the specified rectangular area is entirely inside the closed
     * boundary of the specified {@link PathIterator}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#contains(double, double, double, double)} method.
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @param {number} w
     * the width of the specified rectangular area
     * @param {number} h
     * the height of the specified rectangular area
     * @return {boolean} {@code true} if the specified {@code PathIterator} contains the
     * specified rectangular area; {@code false} otherwise.
     * @since 1.6
     */
    static contains$java_awt_geom_PathIterator$double$double$double$double(pi: PathIterator, x: number, y: number, w: number, h: number): boolean;
    /**
     * Tests if the specified rectangular area is entirely inside the closed
     * boundary of the specified {@link PathIterator}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#contains(double, double, double, double)} method.
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @param {number} w
     * the width of the specified rectangular area
     * @param {number} h
     * the height of the specified rectangular area
     * @return {boolean} {@code true} if the specified {@code PathIterator} contains the
     * specified rectangular area; {@code false} otherwise.
     * @since 1.6
     */
    static contains(pi?: any, x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Tests if the specified {@link Rectangle2D} is entirely inside the closed
     * boundary of the specified {@link PathIterator}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#contains(Rectangle2D)} method.
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {Rectangle2D} r
     * a specified {@code Rectangle2D}
     * @return {boolean} {@code true} if the specified {@code PathIterator} contains the
     * specified {@code Rectangle2D}; {@code false} otherwise.
     * @since 1.6
     */
    static contains$java_awt_geom_PathIterator$java_awt_geom_Rectangle2D(pi: PathIterator, r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @since 1.6
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @since 1.6
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return false in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such segments could lie entirely within the interior of the
     * path if they are part of a path with a {@link #WIND_NON_ZERO} winding
     * rule or if the segments are retraced in the reverse direction such that
     * the two sets of segments cancel each other out without any exterior area
     * falling between them. To determine whether segments represent true
     * boundaries of the interior of the path would require extensive
     * calculations involving all of the segments of the path and the winding
     * rule and are thus beyond the scope of this implementation.
     *
     * @since 1.6
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * Tests if the interior of the specified {@link PathIterator} intersects
     * the interior of a specified set of rectangular coordinates.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#intersects(double, double, double, double)} method.
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @param {number} w
     * the width of the specified rectangular coordinates
     * @param {number} h
     * the height of the specified rectangular coordinates
     * @return {boolean} {@code true} if the specified {@code PathIterator} and the
     * interior of the specified set of rectangular coordinates
     * intersect each other; {@code false} otherwise.
     * @since 1.6
     */
    static intersects$java_awt_geom_PathIterator$double$double$double$double(pi: PathIterator, x: number, y: number, w: number, h: number): boolean;
    /**
     * Tests if the interior of the specified {@link PathIterator} intersects
     * the interior of a specified set of rectangular coordinates.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#intersects(double, double, double, double)} method.
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @param {number} w
     * the width of the specified rectangular coordinates
     * @param {number} h
     * the height of the specified rectangular coordinates
     * @return {boolean} {@code true} if the specified {@code PathIterator} and the
     * interior of the specified set of rectangular coordinates
     * intersect each other; {@code false} otherwise.
     * @since 1.6
     */
    static intersects(pi?: any, x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Tests if the interior of the specified {@link PathIterator} intersects
     * the interior of a specified {@link Rectangle2D}.
     * <p>
     * This method provides a basic facility for implementors of the
     * {@link Shape} interface to implement support for the
     * {@link Shape#intersects(Rectangle2D)} method.
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @param {PathIterator} pi
     * the specified {@code PathIterator}
     * @param {Rectangle2D} r
     * the specified {@code Rectangle2D}
     * @return {boolean} {@code true} if the specified {@code PathIterator} and the
     * interior of the specified {@code Rectangle2D} intersect each
     * other; {@code false} otherwise.
     * @since 1.6
     */
    static intersects$java_awt_geom_PathIterator$java_awt_geom_Rectangle2D(pi: PathIterator, r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @since 1.6
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @since 1.6
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     * <p>
     * This method object may conservatively return true in cases where the
     * specified rectangular area intersects a segment of the path, but that
     * segment does not represent a boundary between the interior and exterior
     * of the path. Such a case may occur if some set of segments of the path
     * are retraced in the reverse direction such that the two sets of segments
     * cancel each other out without any interior area between them. To
     * determine whether segments represent true boundaries of the interior of
     * the path would require extensive calculations involving all of the
     * segments of the path and the winding rule and are thus beyond the scope
     * of this implementation.
     *
     * @since 1.6
     * @param {Rectangle2D} r
     * @return {boolean}
     */
    intersects$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    /**
     * {@inheritDoc}
     * <p>
     * The iterator for this class is not multi-threaded safe, which means that
     * this {@code Path2D} class does not guarantee that modifications to the
     * geometry of this {@code Path2D} object do not affect any iterations of
     * that geometry that are already in process.
     *
     * @since 1.6
     * @param {AffineTransform} at
     * @param {number} flatness
     * @return {PathIterator}
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * {@inheritDoc}
     * <p>
     * The iterator for this class is not multi-threaded safe, which means that
     * this {@code Path2D} class does not guarantee that modifications to the
     * geometry of this {@code Path2D} object do not affect any iterations of
     * that geometry that are already in process.
     *
     * @since 1.6
     * @param {AffineTransform} at
     * @param {number} flatness
     * @return {PathIterator}
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Creates a new object of the same class as this object.
     *
     * @return {*} a clone of this instance.
     * @exception OutOfMemoryError
     * if there is not enough memory.
     * @see java.lang.Cloneable
     * @since 1.6
     */
    abstract clone(): any;
}
declare namespace Path2D {
    abstract class Iterator implements PathIterator {
        abstract currentSegment(coords: any): any;
        abstract currentSegment(coords: any): any;
        typeIdx: number;
        pointIdx: number;
        path: Path2D;
        static curvecoords: number[];
        static curvecoords_$LI$(): number[];
        constructor(path: Path2D);
        getWindingRule(): number;
        isDone(): boolean;
        next(doNext?: any): any;
        next$(): void;
    }
    /**
     * Constructs a new empty single precision {@code Path2D} object with
     * the specified winding rule and the specified initial capacity to
     * store path segments. This number is an initial guess as to how many
     * path segments will be added to the path, but the storage is expanded
     * as needed to store whatever path segments are added.
     *
     * @param {number} rule
     * the winding rule
     * @param {number} initialCapacity
     * the estimate for the number of path segments in the path
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @since 1.6
     * @class
     */
    class Float extends Path2D {
        floatCoords: number[];
        constructor(s?: any, at?: any);
        cloneCoordsFloat(at: AffineTransform): number[];
        cloneCoordsDouble(at: AffineTransform): number[];
        append$float$float(x: number, y: number): void;
        append$double$double(x: number, y: number): void;
        getPoint(coordindex: number): Point2D;
        needRoom(needMove: boolean, newCoords: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x
         * @param {number} y
         */
        moveTo$double$double(x: number, y: number): void;
        /**
         * Adds a point to the path by moving to the specified coordinates
         * specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code moveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#moveTo
         * @since 1.6
         */
        moveTo$float$float(x: number, y: number): void;
        /**
         * Adds a point to the path by moving to the specified coordinates
         * specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code moveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#moveTo
         * @since 1.6
         */
        moveTo(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x
         * @param {number} y
         */
        lineTo$double$double(x: number, y: number): void;
        /**
         * Adds a point to the path by drawing a straight line from the current
         * coordinates to the new specified coordinates specified in float
         * precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code lineTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#lineTo
         * @since 1.6
         */
        lineTo$float$float(x: number, y: number): void;
        /**
         * Adds a point to the path by drawing a straight line from the current
         * coordinates to the new specified coordinates specified in float
         * precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code lineTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#lineTo
         * @since 1.6
         */
        lineTo(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        quadTo$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * Adds a curved segment, defined by two new points, to the path by
         * drawing a Quadratic curve that intersects both the current
         * coordinates and the specified coordinates {@code (x2,y2)}, using the
         * specified point {@code (x1,y1)} as a quadratic parametric control
         * point. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code quadTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the quadratic control point
         * @param {number} y1
         * the Y coordinate of the quadratic control point
         * @param {number} x2
         * the X coordinate of the final end point
         * @param {number} y2
         * the Y coordinate of the final end point
         * @see Path2D#quadTo
         * @since 1.6
         */
        quadTo$float$float$float$float(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * Adds a curved segment, defined by two new points, to the path by
         * drawing a Quadratic curve that intersects both the current
         * coordinates and the specified coordinates {@code (x2,y2)}, using the
         * specified point {@code (x1,y1)} as a quadratic parametric control
         * point. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code quadTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the quadratic control point
         * @param {number} y1
         * the Y coordinate of the quadratic control point
         * @param {number} x2
         * the X coordinate of the final end point
         * @param {number} y2
         * the Y coordinate of the final end point
         * @see Path2D#quadTo
         * @since 1.6
         */
        quadTo(x1?: any, y1?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         * @param {number} x3
         * @param {number} y3
         */
        curveTo$double$double$double$double$double$double(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
        /**
         * Adds a curved segment, defined by three new points, to the path by
         * drawing a B&eacute;zier curve that intersects both the current
         * coordinates and the specified coordinates {@code (x3,y3)}, using the
         * specified points {@code (x1,y1)} and {@code (x2,y2)} as B&eacute;zier
         * control points. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code curveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the first B&eacute;zier control point
         * @param {number} y1
         * the Y coordinate of the first B&eacute;zier control point
         * @param {number} x2
         * the X coordinate of the second B&eacute;zier control point
         * @param {number} y2
         * the Y coordinate of the second B&eacute;zier control point
         * @param {number} x3
         * the X coordinate of the final end point
         * @param {number} y3
         * the Y coordinate of the final end point
         * @see Path2D#curveTo
         * @since 1.6
         */
        curveTo$float$float$float$float$float$float(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
        /**
         * Adds a curved segment, defined by three new points, to the path by
         * drawing a B&eacute;zier curve that intersects both the current
         * coordinates and the specified coordinates {@code (x3,y3)}, using the
         * specified points {@code (x1,y1)} and {@code (x2,y2)} as B&eacute;zier
         * control points. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code curveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the first B&eacute;zier control point
         * @param {number} y1
         * the Y coordinate of the first B&eacute;zier control point
         * @param {number} x2
         * the X coordinate of the second B&eacute;zier control point
         * @param {number} y2
         * the Y coordinate of the second B&eacute;zier control point
         * @param {number} x3
         * the X coordinate of the final end point
         * @param {number} y3
         * the Y coordinate of the final end point
         * @see Path2D#curveTo
         * @since 1.6
         */
        curveTo(x1?: any, y1?: any, x2?: any, y2?: any, x3?: any, y3?: any): any;
        pointCrossings(px: number, py: number): number;
        rectCrossings(rxmin: number, rymin: number, rxmax: number, rymax: number): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {PathIterator} pi
         * @param {boolean} connect
         */
        append$java_awt_geom_PathIterator$boolean(pi: PathIterator, connect: boolean): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {PathIterator} pi
         * @param {boolean} connect
         */
        append(pi?: any, connect?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {AffineTransform} at
         */
        transform(at: AffineTransform): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        /**
         * {@inheritDoc}
         * <p>
         * The iterator for this class is not multi-threaded safe, which means that
         * this {@code Path2D} class does not guarantee that modifications to the
         * geometry of this {@code Path2D} object do not affect any iterations of
         * that geometry that are already in process.
         *
         * @since 1.6
         * @param {AffineTransform} at
         * @param {number} flatness
         * @return {PathIterator}
         */
        getPathIterator(at?: any, flatness?: any): any;
        /**
         * {@inheritDoc}
         * <p>
         * The iterator for this class is not multi-threaded safe, which means
         * that the {@code Path2D} class does not guarantee that modifications
         * to the geometry of this {@code Path2D} object do not affect any
         * iterations of that geometry that are already in process.
         *
         * @since 1.6
         * @param {AffineTransform} at
         * @return {PathIterator}
         */
        getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
        /**
         * Creates a new object of the same class as this object.
         *
         * @return {*} a clone of this instance.
         * @exception OutOfMemoryError
         * if there is not enough memory.
         * @see java.lang.Cloneable
         * @since 1.6
         */
        clone(): any;
        static serialVersionUID: number;
    }
    namespace Float {
        class CopyIterator extends Path2D.Iterator {
            floatCoords: number[];
            constructor(p2df: Path2D.Float);
            currentSegment$float_A(coords: number[]): number;
            currentSegment(coords?: any): any;
            currentSegment$double_A(coords: number[]): number;
        }
        class TxIterator extends Path2D.Iterator {
            floatCoords: number[];
            affine: AffineTransform;
            constructor(p2df: Path2D.Float, at: AffineTransform);
            currentSegment$float_A(coords: number[]): number;
            currentSegment(coords?: any): any;
            currentSegment$double_A(coords: number[]): number;
        }
    }
    /**
     * Constructs a new empty double precision {@code Path2D} object with
     * the specified winding rule and the specified initial capacity to
     * store path segments. This number is an initial guess as to how many
     * path segments are in the path, but the storage is expanded as needed
     * to store whatever path segments are added to this path.
     *
     * @param {number} rule
     * the winding rule
     * @param {number} initialCapacity
     * the estimate for the number of path segments in the path
     * @see #WIND_EVEN_ODD
     * @see #WIND_NON_ZERO
     * @since 1.6
     * @class
     */
    class Double extends Path2D {
        doubleCoords: number[];
        constructor(s?: any, at?: any);
        cloneCoordsFloat(at: AffineTransform): number[];
        cloneCoordsDouble(at: AffineTransform): number[];
        append$float$float(x: number, y: number): void;
        append$double$double(x: number, y: number): void;
        getPoint(coordindex: number): Point2D;
        needRoom(needMove: boolean, newCoords: number): void;
        /**
         * Adds a point to the path by moving to the specified coordinates
         * specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code moveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#moveTo
         * @since 1.6
         */
        moveTo(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x
         * @param {number} y
         */
        moveTo$double$double(x: number, y: number): void;
        /**
         * Adds a point to the path by drawing a straight line from the current
         * coordinates to the new specified coordinates specified in float
         * precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code lineTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x
         * the specified X coordinate
         * @param {number} y
         * the specified Y coordinate
         * @see Path2D#lineTo
         * @since 1.6
         */
        lineTo(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x
         * @param {number} y
         */
        lineTo$double$double(x: number, y: number): void;
        /**
         * Adds a curved segment, defined by two new points, to the path by
         * drawing a Quadratic curve that intersects both the current
         * coordinates and the specified coordinates {@code (x2,y2)}, using the
         * specified point {@code (x1,y1)} as a quadratic parametric control
         * point. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code quadTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the quadratic control point
         * @param {number} y1
         * the Y coordinate of the quadratic control point
         * @param {number} x2
         * the X coordinate of the final end point
         * @param {number} y2
         * the Y coordinate of the final end point
         * @see Path2D#quadTo
         * @since 1.6
         */
        quadTo(x1?: any, y1?: any, x2?: any, y2?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        quadTo$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
        /**
         * Adds a curved segment, defined by three new points, to the path by
         * drawing a B&eacute;zier curve that intersects both the current
         * coordinates and the specified coordinates {@code (x3,y3)}, using the
         * specified points {@code (x1,y1)} and {@code (x2,y2)} as B&eacute;zier
         * control points. All coordinates are specified in float precision.
         * <p>
         * This method provides a single precision variant of the double
         * precision {@code curveTo()} method on the base {@code Path2D} class.
         *
         * @param {number} x1
         * the X coordinate of the first B&eacute;zier control point
         * @param {number} y1
         * the Y coordinate of the first B&eacute;zier control point
         * @param {number} x2
         * the X coordinate of the second B&eacute;zier control point
         * @param {number} y2
         * the Y coordinate of the second B&eacute;zier control point
         * @param {number} x3
         * the X coordinate of the final end point
         * @param {number} y3
         * the Y coordinate of the final end point
         * @see Path2D#curveTo
         * @since 1.6
         */
        curveTo(x1?: any, y1?: any, x2?: any, y2?: any, x3?: any, y3?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         * @param {number} x3
         * @param {number} y3
         */
        curveTo$double$double$double$double$double$double(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
        pointCrossings(px: number, py: number): number;
        rectCrossings(rxmin: number, rymin: number, rxmax: number, rymax: number): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {PathIterator} pi
         * @param {boolean} connect
         */
        append$java_awt_geom_PathIterator$boolean(pi: PathIterator, connect: boolean): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {PathIterator} pi
         * @param {boolean} connect
         */
        append(pi?: any, connect?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @param {AffineTransform} at
         */
        transform(at: AffineTransform): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.6
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        /**
         * {@inheritDoc}
         * <p>
         * The iterator for this class is not multi-threaded safe, which means that
         * this {@code Path2D} class does not guarantee that modifications to the
         * geometry of this {@code Path2D} object do not affect any iterations of
         * that geometry that are already in process.
         *
         * @since 1.6
         * @param {AffineTransform} at
         * @param {number} flatness
         * @return {PathIterator}
         */
        getPathIterator(at?: any, flatness?: any): any;
        /**
         * {@inheritDoc}
         * <p>
         * The iterator for this class is not multi-threaded safe, which means
         * that the {@code Path2D} class does not guarantee that modifications
         * to the geometry of this {@code Path2D} object do not affect any
         * iterations of that geometry that are already in process.
         *
         * @param {AffineTransform} at
         * an {@code AffineTransform}
         * @return {PathIterator} a new {@code PathIterator} that iterates along the boundary
         * of this {@code Shape} and provides access to the geometry of
         * this {@code Shape}'s outline
         * @since 1.6
         */
        getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
        /**
         * Creates a new object of the same class as this object.
         *
         * @return {*} a clone of this instance.
         * @exception OutOfMemoryError
         * if there is not enough memory.
         * @see java.lang.Cloneable
         * @since 1.6
         */
        clone(): any;
        static serialVersionUID: number;
    }
    namespace Double {
        class CopyIterator extends Path2D.Iterator {
            doubleCoords: number[];
            constructor(p2dd: Path2D.Double);
            currentSegment$float_A(coords: number[]): number;
            currentSegment(coords?: any): any;
            currentSegment$double_A(coords: number[]): number;
        }
        class TxIterator extends Path2D.Iterator {
            doubleCoords: number[];
            affine: AffineTransform;
            constructor(p2dd: Path2D.Double, at: AffineTransform);
            currentSegment$float_A(coords: number[]): number;
            currentSegment(coords?: any): any;
            currentSegment$double_A(coords: number[]): number;
        }
    }
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for
 * instantiation and provide a number of formats for storing
 * the information necessary to satisfy the various accessor
 * methods below.
 *
 * @param {number} type The closure type of this arc:
 * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
 * @see java.awt.geom.Arc2D.Float
 * @see java.awt.geom.Arc2D.Double
 * @since 1.2
 * @class
 */
declare abstract class Arc2D extends RectangularShape {
    /**
     * The closure type for an open arc with no path segments
     * connecting the two ends of the arc segment.
     * @since 1.2
     */
    static OPEN: number;
    /**
     * The closure type for an arc closed by drawing a straight
     * line segment from the start of the arc segment to the end of the
     * arc segment.
     * @since 1.2
     */
    static CHORD: number;
    /**
     * The closure type for an arc closed by drawing straight line
     * segments from the start of the arc segment to the center
     * of the full ellipse and from that point to the end of the arc segment.
     * @since 1.2
     */
    static PIE: number;
    type: number;
    constructor(type?: any);
    /**
     * Returns the starting angle of the arc.
     *
     * @return {number} A double value that represents the starting angle
     * of the arc in degrees.
     * @see #setAngleStart
     * @since 1.2
     */
    abstract getAngleStart(): number;
    /**
     * Returns the angular extent of the arc.
     *
     * @return {number} A double value that represents the angular extent
     * of the arc in degrees.
     * @see #setAngleExtent
     * @since 1.2
     */
    abstract getAngleExtent(): number;
    /**
     * Returns the arc closure type of the arc: {@link #OPEN},
     * {@link #CHORD}, or {@link #PIE}.
     * @return {number} One of the integer constant closure types defined
     * in this class.
     * @see #setArcType
     * @since 1.2
     */
    getArcType(): number;
    /**
     * Returns the starting point of the arc.  This point is the
     * intersection of the ray from the center defined by the
     * starting angle and the elliptical boundary of the arc.
     *
     * @return {Point2D} A <CODE>Point2D</CODE> object representing the
     * x,y coordinates of the starting point of the arc.
     * @since 1.2
     */
    getStartPoint(): Point2D;
    /**
     * Returns the ending point of the arc.  This point is the
     * intersection of the ray from the center defined by the
     * starting angle plus the angular extent of the arc and the
     * elliptical boundary of the arc.
     *
     * @return {Point2D} A <CODE>Point2D</CODE> object representing the
     * x,y coordinates  of the ending point of the arc.
     * @since 1.2
     */
    getEndPoint(): Point2D;
    /**
     * Sets the location, size, angular extents, and closure type of
     * this arc to the specified double values.
     *
     * @param {number} x The X coordinate of the upper-left corner of the arc.
     * @param {number} y The Y coordinate of the upper-left corner of the arc.
     * @param {number} w The overall width of the full ellipse of which
     * this arc is a partial section.
     * @param {number} h The overall height of the full ellipse of which
     * this arc is a partial section.
     * @param {number} angSt The starting angle of the arc in degrees.
     * @param {number} angExt The angular extent of the arc in degrees.
     * @param {number} closure The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     */
    setArc$double$double$double$double$double$double$int(x: number, y: number, w: number, h: number, angSt: number, angExt: number, closure: number): void;
    /**
     * Sets the location, size, angular extents, and closure type of
     * this arc to the specified double values.
     *
     * @param {number} x The X coordinate of the upper-left corner of the arc.
     * @param {number} y The Y coordinate of the upper-left corner of the arc.
     * @param {number} w The overall width of the full ellipse of which
     * this arc is a partial section.
     * @param {number} h The overall height of the full ellipse of which
     * this arc is a partial section.
     * @param {number} angSt The starting angle of the arc in degrees.
     * @param {number} angExt The angular extent of the arc in degrees.
     * @param {number} closure The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     */
    setArc(x?: any, y?: any, w?: any, h?: any, angSt?: any, angExt?: any, closure?: any): any;
    /**
     * Sets the location, size, angular extents, and closure type of
     * this arc to the specified values.
     *
     * @param {Point2D} loc The <CODE>Point2D</CODE> representing the coordinates of
     * the upper-left corner of the arc.
     * @param {Dimension2D} size The <CODE>Dimension2D</CODE> representing the width
     * and height of the full ellipse of which this arc is
     * a partial section.
     * @param {number} angSt The starting angle of the arc in degrees.
     * @param {number} angExt The angular extent of the arc in degrees.
     * @param {number} closure The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     */
    setArc$java_awt_geom_Point2D$java_awt_geom_Dimension2D$double$double$int(loc: Point2D, size: Dimension2D, angSt: number, angExt: number, closure: number): void;
    /**
     * Sets the location, size, angular extents, and closure type of
     * this arc to the specified values.
     *
     * @param {Rectangle2D} rect The framing rectangle that defines the
     * outer boundary of the full ellipse of which this arc is a
     * partial section.
     * @param {number} angSt The starting angle of the arc in degrees.
     * @param {number} angExt The angular extent of the arc in degrees.
     * @param {number} closure The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     */
    setArc$java_awt_geom_Rectangle2D$double$double$int(rect: Rectangle2D, angSt: number, angExt: number, closure: number): void;
    /**
     * Sets this arc to be the same as the specified arc.
     *
     * @param {Arc2D} a The <CODE>Arc2D</CODE> to use to set the arc's values.
     * @since 1.2
     */
    setArc$java_awt_geom_Arc2D(a: Arc2D): void;
    /**
     * Sets the position, bounds, angular extents, and closure type of
     * this arc to the specified values. The arc is defined by a center
     * point and a radius rather than a framing rectangle for the full ellipse.
     *
     * @param {number} x The X coordinate of the center of the arc.
     * @param {number} y The Y coordinate of the center of the arc.
     * @param {number} radius The radius of the arc.
     * @param {number} angSt The starting angle of the arc in degrees.
     * @param {number} angExt The angular extent of the arc in degrees.
     * @param {number} closure The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     */
    setArcByCenter(x: number, y: number, radius: number, angSt: number, angExt: number, closure: number): void;
    /**
     * Sets the position, bounds, and angular extents of this arc to the
     * specified value. The starting angle of the arc is tangent to the
     * line specified by points (p1, p2), the ending angle is tangent to
     * the line specified by points (p2, p3), and the arc has the
     * specified radius.
     *
     * @param {Point2D} p1 The first point that defines the arc. The starting
     * angle of the arc is tangent to the line specified by points (p1, p2).
     * @param {Point2D} p2 The second point that defines the arc. The starting
     * angle of the arc is tangent to the line specified by points (p1, p2).
     * The ending angle of the arc is tangent to the line specified by
     * points (p2, p3).
     * @param {Point2D} p3 The third point that defines the arc. The ending angle
     * of the arc is tangent to the line specified by points (p2, p3).
     * @param {number} radius The radius of the arc.
     * @since 1.2
     */
    setArcByTangent(p1: Point2D, p2: Point2D, p3: Point2D, radius: number): void;
    /**
     * Sets the starting angle of this arc to the specified double
     * value.
     *
     * @param {number} angSt The starting angle of the arc in degrees.
     * @see #getAngleStart
     * @since 1.2
     */
    setAngleStart$double(angSt: number): void;
    /**
     * Sets the angular extent of this arc to the specified double
     * value.
     *
     * @param {number} angExt The angular extent of the arc in degrees.
     * @see #getAngleExtent
     * @since 1.2
     */
    abstract setAngleExtent(angExt: number): any;
    /**
     * Sets the starting angle of this arc to the angle that the
     * specified point defines relative to the center of this arc.
     * The angular extent of the arc will remain the same.
     *
     * @param {Point2D} p The <CODE>Point2D</CODE> that defines the starting angle.
     * @see #getAngleStart
     * @since 1.2
     */
    setAngleStart$java_awt_geom_Point2D(p: Point2D): void;
    /**
     * Sets the starting angle of this arc to the angle that the
     * specified point defines relative to the center of this arc.
     * The angular extent of the arc will remain the same.
     *
     * @param {Point2D} p The <CODE>Point2D</CODE> that defines the starting angle.
     * @see #getAngleStart
     * @since 1.2
     */
    setAngleStart(p?: any): any;
    /**
     * Sets the starting angle and angular extent of this arc using two
     * sets of coordinates. The first set of coordinates is used to
     * determine the angle of the starting point relative to the arc's
     * center. The second set of coordinates is used to determine the
     * angle of the end point relative to the arc's center.
     * The arc will always be non-empty and extend counterclockwise
     * from the first point around to the second point.
     *
     * @param {number} x1 The X coordinate of the arc's starting point.
     * @param {number} y1 The Y coordinate of the arc's starting point.
     * @param {number} x2 The X coordinate of the arc's ending point.
     * @param {number} y2 The Y coordinate of the arc's ending point.
     * @since 1.2
     */
    setAngles$double$double$double$double(x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Sets the starting angle and angular extent of this arc using two
     * sets of coordinates. The first set of coordinates is used to
     * determine the angle of the starting point relative to the arc's
     * center. The second set of coordinates is used to determine the
     * angle of the end point relative to the arc's center.
     * The arc will always be non-empty and extend counterclockwise
     * from the first point around to the second point.
     *
     * @param {number} x1 The X coordinate of the arc's starting point.
     * @param {number} y1 The Y coordinate of the arc's starting point.
     * @param {number} x2 The X coordinate of the arc's ending point.
     * @param {number} y2 The Y coordinate of the arc's ending point.
     * @since 1.2
     */
    setAngles(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Sets the starting angle and angular extent of this arc using
     * two points. The first point is used to determine the angle of
     * the starting point relative to the arc's center.
     * The second point is used to determine the angle of the end point
     * relative to the arc's center.
     * The arc will always be non-empty and extend counterclockwise
     * from the first point around to the second point.
     *
     * @param {Point2D} p1 The <CODE>Point2D</CODE> that defines the arc's
     * starting point.
     * @param {Point2D} p2 The <CODE>Point2D</CODE> that defines the arc's
     * ending point.
     * @since 1.2
     */
    setAngles$java_awt_geom_Point2D$java_awt_geom_Point2D(p1: Point2D, p2: Point2D): void;
    /**
     * Sets the closure type of this arc to the specified value:
     * <CODE>OPEN</CODE>, <CODE>CHORD</CODE>, or <CODE>PIE</CODE>.
     *
     * @param {number} type The integer constant that represents the closure
     * type of this arc: {@link #OPEN}, {@link #CHORD}, or
     * {@link #PIE}.
     *
     * @throws IllegalArgumentException if <code>type</code> is not
     * 0, 1, or 2.+
     * @see #getArcType
     * @since 1.2
     */
    setArcType(type: number): void;
    /**
     * {@inheritDoc}
     * Note that the arc
     * <a href="Arc2D.html#inscribes">partially inscribes</a>
     * the framing rectangle of this {@code RectangularShape}.
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
    /**
     * {@inheritDoc}
     * Note that the arc
     * <a href="Arc2D.html#inscribes">partially inscribes</a>
     * the framing rectangle of this {@code RectangularShape}.
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setFrame(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Returns the high-precision framing rectangle of the arc.  The framing
     * rectangle contains only the part of this <code>Arc2D</code> that is
     * in between the starting and ending angles and contains the pie
     * wedge, if this <code>Arc2D</code> has a <code>PIE</code> closure type.
     * <p>
     * This method differs from the
     * {@link RectangularShape#getBounds() getBounds} in that the
     * <code>getBounds</code> method only returns the bounds of the
     * enclosing ellipse of this <code>Arc2D</code> without considering
     * the starting and ending angles of this <code>Arc2D</code>.
     *
     * @return {Rectangle2D} the <CODE>Rectangle2D</CODE> that represents the arc's
     * framing rectangle.
     * @since 1.2
     */
    getBounds2D(): Rectangle2D;
    /**
     * Constructs a <code>Rectangle2D</code> of the appropriate precision
     * to hold the parameters calculated to be the framing rectangle
     * of this arc.
     *
     * @param {number} x The X coordinate of the upper-left corner of the
     * framing rectangle.
     * @param {number} y The Y coordinate of the upper-left corner of the
     * framing rectangle.
     * @param {number} w The width of the framing rectangle.
     * @param {number} h The height of the framing rectangle.
     * @return {Rectangle2D} a <code>Rectangle2D</code> that is the framing rectangle
     * of this arc.
     * @since 1.2
     */
    abstract makeBounds(x: number, y: number, w: number, h: number): Rectangle2D;
    static normalizeDegrees(angle: number): number;
    /**
     * Determines whether or not the specified angle is within the
     * angular extents of the arc.
     *
     * @param {number} angle The angle to test.
     *
     * @return {boolean} <CODE>true</CODE> if the arc contains the angle,
     * <CODE>false</CODE> if the arc doesn't contain the angle.
     * @since 1.2
     */
    containsAngle(angle: number): boolean;
    /**
     * Determines whether or not the specified point is inside the boundary
     * of the arc.
     *
     * @param {number} x The X coordinate of the point to test.
     * @param {number} y The Y coordinate of the point to test.
     *
     * @return {boolean} <CODE>true</CODE> if the point lies within the bound of
     * the arc, <CODE>false</CODE> if the point lies outside of the
     * arc's bounds.
     * @since 1.2
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * Determines whether or not the interior of the arc intersects
     * the interior of the specified rectangle.
     *
     * @param {number} x The X coordinate of the rectangle's upper-left corner.
     * @param {number} y The Y coordinate of the rectangle's upper-left corner.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     *
     * @return {boolean} <CODE>true</CODE> if the arc intersects the rectangle,
     * <CODE>false</CODE> if the arc doesn't intersect the rectangle.
     * @since 1.2
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * Determines whether or not the interior of the arc intersects
     * the interior of the specified rectangle.
     *
     * @param {number} x The X coordinate of the rectangle's upper-left corner.
     * @param {number} y The Y coordinate of the rectangle's upper-left corner.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     *
     * @return {boolean} <CODE>true</CODE> if the arc intersects the rectangle,
     * <CODE>false</CODE> if the arc doesn't intersect the rectangle.
     * @since 1.2
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Determines whether or not the interior of the arc entirely contains
     * the specified rectangle.
     *
     * @param {number} x The X coordinate of the rectangle's upper-left corner.
     * @param {number} y The Y coordinate of the rectangle's upper-left corner.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     *
     * @return {boolean} <CODE>true</CODE> if the arc contains the rectangle,
     * <CODE>false</CODE> if the arc doesn't contain the rectangle.
     * @since 1.2
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * Determines whether or not the interior of the arc entirely contains
     * the specified rectangle.
     *
     * @param {Rectangle2D} r The <CODE>Rectangle2D</CODE> to test.
     *
     * @return {boolean} <CODE>true</CODE> if the arc contains the rectangle,
     * <CODE>false</CODE> if the arc doesn't contain the rectangle.
     * @since 1.2
     */
    contains$java_awt_geom_Rectangle2D(r: Rectangle2D): boolean;
    contains$double$double$double$double$java_awt_geom_Rectangle2D(x: number, y: number, w: number, h: number, origrect: Rectangle2D): boolean;
    contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Returns an iteration object that defines the boundary of the
     * arc.
     * This iterator is multithread safe.
     * <code>Arc2D</code> guarantees that
     * modifications to the geometry of the arc
     * do not affect any iterations of that geometry that
     * are already in process.
     *
     * @param {AffineTransform} at an optional <CODE>AffineTransform</CODE> to be applied
     * to the coordinates as they are returned in the iteration, or null
     * if the untransformed coordinates are desired.
     *
     * @return {PathIterator} A <CODE>PathIterator</CODE> that defines the arc's boundary.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Determines whether or not the specified <code>Object</code> is
     * equal to this <code>Arc2D</code>.  The specified
     * <code>Object</code> is equal to this <code>Arc2D</code>
     * if it is an instance of <code>Arc2D</code> and if its
     * location, size, arc extents and type are the same as this
     * <code>Arc2D</code>.
     * @param {*} obj  an <code>Object</code> to be compared with this
     * <code>Arc2D</code>.
     * @return  {boolean} <code>true</code> if <code>obj</code> is an instance
     * of <code>Arc2D</code> and has the same values;
     * <code>false</code> otherwise.
     * @since 1.6
     */
    equals(obj: any): boolean;
}
declare namespace Arc2D {
    /**
     * Constructs a new arc, initialized to the specified location,
     * size, angular extents, and closure type.
     *
     * @param {number} x The X coordinate of the upper-left corner of
     * the arc's framing rectangle.
     * @param {number} y The Y coordinate of the upper-left corner of
     * the arc's framing rectangle.
     * @param {number} w The overall width of the full ellipse of which
     * this arc is a partial section.
     * @param {number} h The overall height of the full ellipse of which this
     * arc is a partial section.
     * @param {number} start The starting angle of the arc in degrees.
     * @param {number} extent The angular extent of the arc in degrees.
     * @param {number} type The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     * @class
     */
    class Float extends Arc2D {
        /**
         * The X coordinate of the upper-left corner of the framing
         * rectangle of the arc.
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of the upper-left corner of the framing
         * rectangle of the arc.
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The overall width of the full ellipse of which this arc is
         * a partial section (not considering the
         * angular extents).
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The overall height of the full ellipse of which this arc is
         * a partial section (not considering the
         * angular extents).
         * @since 1.2
         * @serial
         */
        height: number;
        /**
         * The starting angle of the arc in degrees.
         * @since 1.2
         * @serial
         */
        start: number;
        /**
         * The angular extent of the arc in degrees.
         * @since 1.2
         * @serial
         */
        extent: number;
        constructor(x?: any, y?: any, w?: any, h?: any, start?: any, extent?: any, type?: any);
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {number}
         */
        getAngleStart(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {number}
         */
        getAngleExtent(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} angSt
         * @param {number} angExt
         * @param {number} closure
         */
        setArc$double$double$double$double$double$double$int(x: number, y: number, w: number, h: number, angSt: number, angExt: number, closure: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} angSt
         * @param {number} angExt
         * @param {number} closure
         */
        setArc(x?: any, y?: any, w?: any, h?: any, angSt?: any, angExt?: any, closure?: any): any;
        /**
         * Sets the starting angle of this arc to the angle that the
         * specified point defines relative to the center of this arc.
         * The angular extent of the arc will remain the same.
         *
         * @param {Point2D} p The <CODE>Point2D</CODE> that defines the starting angle.
         * @see #getAngleStart
         * @since 1.2
         */
        setAngleStart(p?: any): any;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} angSt
         */
        setAngleStart$double(angSt: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} angExt
         */
        setAngleExtent(angExt: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @return {Rectangle2D}
         */
        makeBounds(x: number, y: number, w: number, h: number): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs a new arc, initialized to the specified location,
     * size, angular extents, and closure type.
     *
     * @param {number} x The X coordinate of the upper-left corner
     * of the arc's framing rectangle.
     * @param {number} y The Y coordinate of the upper-left corner
     * of the arc's framing rectangle.
     * @param {number} w The overall width of the full ellipse of which this
     * arc is a partial section.
     * @param {number} h The overall height of the full ellipse of which this
     * arc is a partial section.
     * @param {number} start The starting angle of the arc in degrees.
     * @param {number} extent The angular extent of the arc in degrees.
     * @param {number} type The closure type for the arc:
     * {@link #OPEN}, {@link #CHORD}, or {@link #PIE}.
     * @since 1.2
     * @class
     */
    class Double extends Arc2D {
        /**
         * The X coordinate of the upper-left corner of the framing
         * rectangle of the arc.
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of the upper-left corner of the framing
         * rectangle of the arc.
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The overall width of the full ellipse of which this arc is
         * a partial section (not considering the angular extents).
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The overall height of the full ellipse of which this arc is
         * a partial section (not considering the angular extents).
         * @since 1.2
         * @serial
         */
        height: number;
        /**
         * The starting angle of the arc in degrees.
         * @since 1.2
         * @serial
         */
        start: number;
        /**
         * The angular extent of the arc in degrees.
         * @since 1.2
         * @serial
         */
        extent: number;
        constructor(x?: any, y?: any, w?: any, h?: any, start?: any, extent?: any, type?: any);
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         * Note that the arc
         * <a href="Arc2D.html#inscribes">partially inscribes</a>
         * the framing rectangle of this {@code RectangularShape}.
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {number}
         */
        getAngleStart(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {number}
         */
        getAngleExtent(): number;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} angSt
         * @param {number} angExt
         * @param {number} closure
         */
        setArc$double$double$double$double$double$double$int(x: number, y: number, w: number, h: number, angSt: number, angExt: number, closure: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} angSt
         * @param {number} angExt
         * @param {number} closure
         */
        setArc(x?: any, y?: any, w?: any, h?: any, angSt?: any, angExt?: any, closure?: any): any;
        /**
         * Sets the starting angle of this arc to the angle that the
         * specified point defines relative to the center of this arc.
         * The angular extent of the arc will remain the same.
         *
         * @param {Point2D} p The <CODE>Point2D</CODE> that defines the starting angle.
         * @see #getAngleStart
         * @since 1.2
         */
        setAngleStart(p?: any): any;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} angSt
         */
        setAngleStart$double(angSt: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} angExt
         */
        setAngleExtent(angExt: number): void;
        /**
         * {@inheritDoc}
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @return {Rectangle2D}
         */
        makeBounds(x: number, y: number, w: number, h: number): Rectangle2D;
        static serialVersionUID: number;
    }
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.Ellipse2D.Float
 * @see java.awt.geom.Ellipse2D.Double
 * @since 1.2
 * @class
 */
declare abstract class Ellipse2D extends RectangularShape {
    constructor();
    contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Returns an iteration object that defines the boundary of this
     * <code>Ellipse2D</code>. The iterator for this class is multi-threaded
     * safe, which means that this <code>Ellipse2D</code> class guarantees that
     * modifications to the geometry of this <code>Ellipse2D</code> object do
     * not affect any iterations of that geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Ellipse2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Determines whether or not the specified <code>Object</code> is equal to
     * this <code>Ellipse2D</code>. The specified <code>Object</code> is equal
     * to this <code>Ellipse2D</code> if it is an instance of
     * <code>Ellipse2D</code> and if its location and size are the same as this
     * <code>Ellipse2D</code>.
     *
     * @param {*} obj
     * an <code>Object</code> to be compared with this
     * <code>Ellipse2D</code>.
     * @return {boolean} <code>true</code> if <code>obj</code> is an instance of
     * <code>Ellipse2D</code> and has the same values;
     * <code>false</code> otherwise.
     * @since 1.6
     */
    equals(obj: any): boolean;
}
declare namespace Ellipse2D {
    /**
     * Constructs and initializes an <code>Ellipse2D</code> from the
     * specified coordinates.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the framing
     * rectangle
     * @param {number} y
     * the Y coordinate of the upper-left corner of the framing
     * rectangle
     * @param {number} w
     * the width of the framing rectangle
     * @param {number} h
     * the height of the framing rectangle
     * @since 1.2
     * @class
     */
    class Float extends Ellipse2D {
        /**
         * The X coordinate of the upper-left corner of the framing rectangle of
         * this {@code Ellipse2D}.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of the upper-left corner of the framing rectangle of
         * this {@code Ellipse2D}.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The overall width of this <code>Ellipse2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The overall height of this <code>Ellipse2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        constructor(x?: any, y?: any, w?: any, h?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location and size of the framing rectangle of this
         * <code>Shape</code> to the specified rectangular values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} y
         * the Y coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} w
         * the width of the specified rectangular shape
         * @param {number} h
         * the height of the specified rectangular shape
         * @since 1.2
         */
        setFrame$float$float$float$float(x: number, y: number, w: number, h: number): void;
        /**
         * Sets the location and size of the framing rectangle of this
         * <code>Shape</code> to the specified rectangular values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} y
         * the Y coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} w
         * the width of the specified rectangular shape
         * @param {number} h
         * the height of the specified rectangular shape
         * @since 1.2
         */
        setFrame(x?: any, y?: any, w?: any, h?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes an <code>Ellipse2D</code> from the
     * specified coordinates.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the framing
     * rectangle
     * @param {number} y
     * the Y coordinate of the upper-left corner of the framing
     * rectangle
     * @param {number} w
     * the width of the framing rectangle
     * @param {number} h
     * the height of the framing rectangle
     * @since 1.2
     * @class
     */
    class Double extends Ellipse2D {
        /**
         * The X coordinate of the upper-left corner of the framing rectangle of
         * this {@code Ellipse2D}.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of the upper-left corner of the framing rectangle of
         * this {@code Ellipse2D}.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The overall width of this <code>Ellipse2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The overall height of the <code>Ellipse2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        constructor(x?: any, y?: any, w?: any, h?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location and size of the framing rectangle of this
         * <code>Shape</code> to the specified rectangular values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} y
         * the Y coordinate of the upper-left corner of the specified
         * rectangular shape
         * @param {number} w
         * the width of the specified rectangular shape
         * @param {number} h
         * the height of the specified rectangular shape
         * @since 1.2
         */
        setFrame(x?: any, y?: any, w?: any, h?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.Rectangle2D.Float
 * @see java.awt.geom.Rectangle2D.Double
 * @see java.awt.Rectangle
 * @since 1.2
 * @class
 */
declare abstract class Rectangle2D extends RectangularShape {
    /**
     * The bitmask that indicates that a point lies to the left of this
     * <code>Rectangle2D</code>.
     *
     * @since 1.2
     */
    static OUT_LEFT: number;
    /**
     * The bitmask that indicates that a point lies above this
     * <code>Rectangle2D</code>.
     *
     * @since 1.2
     */
    static OUT_TOP: number;
    /**
     * The bitmask that indicates that a point lies to the right of this
     * <code>Rectangle2D</code>.
     *
     * @since 1.2
     */
    static OUT_RIGHT: number;
    /**
     * The bitmask that indicates that a point lies below this
     * <code>Rectangle2D</code>.
     *
     * @since 1.2
     */
    static OUT_BOTTOM: number;
    constructor();
    /**
     * Sets the location and size of this <code>Rectangle2D</code> to the
     * specified <code>float</code> values.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} y
     * the Y coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} w
     * the width of this <code>Rectangle2D</code>
     * @param {number} h
     * the height of this <code>Rectangle2D</code>
     * @since 1.2
     */
    setRect(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Sets the location and size of this <code>Rectangle2D</code> to the
     * specified <code>double</code> values.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} y
     * the Y coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} w
     * the width of this <code>Rectangle2D</code>
     * @param {number} h
     * the height of this <code>Rectangle2D</code>
     * @since 1.2
     */
    setRect$double$double$double$double(x: number, y: number, w: number, h: number): void;
    /**
     * Sets this <code>Rectangle2D</code> to be the same as the specified
     * <code>Rectangle2D</code>.
     *
     * @param {Rectangle2D} r
     * the specified <code>Rectangle2D</code>
     * @since 1.2
     */
    setRect$java_awt_geom_Rectangle2D(r: Rectangle2D): void;
    /**
     * Tests if the specified line segment intersects the interior of this
     * <code>Rectangle2D</code>.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @return {boolean} <code>true</code> if the specified line segment intersects the
     * interior of this <code>Rectangle2D</code>; <code>false</code>
     * otherwise.
     * @since 1.2
     */
    intersectsLine$double$double$double$double(x1: number, y1: number, x2: number, y2: number): boolean;
    /**
     * Tests if the specified line segment intersects the interior of this
     * <code>Rectangle2D</code>.
     *
     * @param {number} x1
     * the X coordinate of the start point of the specified line
     * segment
     * @param {number} y1
     * the Y coordinate of the start point of the specified line
     * segment
     * @param {number} x2
     * the X coordinate of the end point of the specified line
     * segment
     * @param {number} y2
     * the Y coordinate of the end point of the specified line
     * segment
     * @return {boolean} <code>true</code> if the specified line segment intersects the
     * interior of this <code>Rectangle2D</code>; <code>false</code>
     * otherwise.
     * @since 1.2
     */
    intersectsLine(x1?: any, y1?: any, x2?: any, y2?: any): any;
    /**
     * Tests if the specified line segment intersects the interior of this
     * <code>Rectangle2D</code>.
     *
     * @param {Line2D} l
     * the specified {@link Line2D} to test for intersection with the
     * interior of this <code>Rectangle2D</code>
     * @return {boolean} <code>true</code> if the specified <code>Line2D</code> intersects
     * the interior of this <code>Rectangle2D</code>; <code>false</code>
     * otherwise.
     * @since 1.2
     */
    intersectsLine$java_awt_geom_Line2D(l: Line2D): boolean;
    /**
     * Determines where the specified coordinates lie with respect to this
     * <code>Rectangle2D</code>. This method computes a binary OR of the
     * appropriate mask values indicating, for each side of this
     * <code>Rectangle2D</code>, whether or not the specified coordinates are on
     * the same side of the edge as the rest of this <code>Rectangle2D</code>.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @return {number} the logical OR of all appropriate out codes.
     * @see #OUT_LEFT
     * @see #OUT_TOP
     * @see #OUT_RIGHT
     * @see #OUT_BOTTOM
     * @since 1.2
     */
    outcode$double$double(x: number, y: number): number;
    /**
     * Determines where the specified coordinates lie with respect to this
     * <code>Rectangle2D</code>. This method computes a binary OR of the
     * appropriate mask values indicating, for each side of this
     * <code>Rectangle2D</code>, whether or not the specified coordinates are on
     * the same side of the edge as the rest of this <code>Rectangle2D</code>.
     *
     * @param {number} x
     * the specified X coordinate
     * @param {number} y
     * the specified Y coordinate
     * @return {number} the logical OR of all appropriate out codes.
     * @see #OUT_LEFT
     * @see #OUT_TOP
     * @see #OUT_RIGHT
     * @see #OUT_BOTTOM
     * @since 1.2
     */
    outcode(x?: any, y?: any): any;
    /**
     * Determines where the specified {@link Point2D} lies with respect to this
     * <code>Rectangle2D</code>. This method computes a binary OR of the
     * appropriate mask values indicating, for each side of this
     * <code>Rectangle2D</code>, whether or not the specified
     * <code>Point2D</code> is on the same side of the edge as the rest of this
     * <code>Rectangle2D</code>.
     *
     * @param {Point2D} p
     * the specified <code>Point2D</code>
     * @return {number} the logical OR of all appropriate out codes.
     * @see #OUT_LEFT
     * @see #OUT_TOP
     * @see #OUT_RIGHT
     * @see #OUT_BOTTOM
     * @since 1.2
     */
    outcode$java_awt_geom_Point2D(p: Point2D): number;
    setFrame(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * Sets the location and size of the outer bounds of this
     * <code>Rectangle2D</code> to the specified rectangular values.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} y
     * the Y coordinate of the upper-left corner of this
     * <code>Rectangle2D</code>
     * @param {number} w
     * the width of this <code>Rectangle2D</code>
     * @param {number} h
     * the height of this <code>Rectangle2D</code>
     * @since 1.2
     */
    setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @return {Rectangle2D}
     */
    getBounds2D(): Rectangle2D;
    contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * Returns a new <code>Rectangle2D</code> object representing the
     * intersection of this <code>Rectangle2D</code> with the specified
     * <code>Rectangle2D</code>.
     *
     * @param {Rectangle2D} r
     * the <code>Rectangle2D</code> to be intersected with this
     * <code>Rectangle2D</code>
     * @return {Rectangle2D} the largest <code>Rectangle2D</code> contained in both the
     * specified <code>Rectangle2D</code> and in this
     * <code>Rectangle2D</code>.
     * @since 1.2
     */
    abstract createIntersection(r: Rectangle2D): Rectangle2D;
    /**
     * Intersects the pair of specified source <code>Rectangle2D</code> objects
     * and puts the result into the specified destination
     * <code>Rectangle2D</code> object. One of the source rectangles can also be
     * the destination to avoid creating a third Rectangle2D object, but in this
     * case the original points of this source rectangle will be overwritten by
     * this method.
     *
     * @param {Rectangle2D} src1
     * the first of a pair of <code>Rectangle2D</code> objects to be
     * intersected with each other
     * @param {Rectangle2D} src2
     * the second of a pair of <code>Rectangle2D</code> objects to be
     * intersected with each other
     * @param {Rectangle2D} dest
     * the <code>Rectangle2D</code> that holds the results of the
     * intersection of <code>src1</code> and <code>src2</code>
     * @since 1.2
     */
    static intersect(src1: Rectangle2D, src2: Rectangle2D, dest: Rectangle2D): void;
    /**
     * Returns a new <code>Rectangle2D</code> object representing the union of
     * this <code>Rectangle2D</code> with the specified <code>Rectangle2D</code>
     * .
     *
     * @param {Rectangle2D} r
     * the <code>Rectangle2D</code> to be combined with this
     * <code>Rectangle2D</code>
     * @return {Rectangle2D} the smallest <code>Rectangle2D</code> containing both the
     * specified <code>Rectangle2D</code> and this
     * <code>Rectangle2D</code>.
     * @since 1.2
     */
    abstract createUnion(r: Rectangle2D): Rectangle2D;
    /**
     * Unions the pair of source <code>Rectangle2D</code> objects and puts the
     * result into the specified destination <code>Rectangle2D</code> object.
     * One of the source rectangles can also be the destination to avoid
     * creating a third Rectangle2D object, but in this case the original points
     * of this source rectangle will be overwritten by this method.
     *
     * @param {Rectangle2D} src1
     * the first of a pair of <code>Rectangle2D</code> objects to be
     * combined with each other
     * @param {Rectangle2D} src2
     * the second of a pair of <code>Rectangle2D</code> objects to be
     * combined with each other
     * @param {Rectangle2D} dest
     * the <code>Rectangle2D</code> that holds the results of the
     * union of <code>src1</code> and <code>src2</code>
     * @since 1.2
     */
    static union(src1: Rectangle2D, src2: Rectangle2D, dest: Rectangle2D): void;
    /**
     * Adds a point, specified by the double precision arguments
     * <code>newx</code> and <code>newy</code>, to this <code>Rectangle2D</code>
     * . The resulting <code>Rectangle2D</code> is the smallest
     * <code>Rectangle2D</code> that contains both the original
     * <code>Rectangle2D</code> and the specified point.
     * <p>
     * After adding a point, a call to <code>contains</code> with the added
     * point as an argument does not necessarily return <code>true</code>. The
     * <code>contains</code> method does not return <code>true</code> for points
     * on the right or bottom edges of a rectangle. Therefore, if the added
     * point falls on the left or bottom edge of the enlarged rectangle,
     * <code>contains</code> returns <code>false</code> for that point.
     *
     * @param {number} newx
     * the X coordinate of the new point
     * @param {number} newy
     * the Y coordinate of the new point
     * @since 1.2
     */
    add$double$double(newx: number, newy: number): void;
    /**
     * Adds a point, specified by the double precision arguments
     * <code>newx</code> and <code>newy</code>, to this <code>Rectangle2D</code>
     * . The resulting <code>Rectangle2D</code> is the smallest
     * <code>Rectangle2D</code> that contains both the original
     * <code>Rectangle2D</code> and the specified point.
     * <p>
     * After adding a point, a call to <code>contains</code> with the added
     * point as an argument does not necessarily return <code>true</code>. The
     * <code>contains</code> method does not return <code>true</code> for points
     * on the right or bottom edges of a rectangle. Therefore, if the added
     * point falls on the left or bottom edge of the enlarged rectangle,
     * <code>contains</code> returns <code>false</code> for that point.
     *
     * @param {number} newx
     * the X coordinate of the new point
     * @param {number} newy
     * the Y coordinate of the new point
     * @since 1.2
     */
    add(newx?: any, newy?: any): any;
    /**
     * Adds the <code>Point2D</code> object <code>pt</code> to this
     * <code>Rectangle2D</code>. The resulting <code>Rectangle2D</code> is the
     * smallest <code>Rectangle2D</code> that contains both the original
     * <code>Rectangle2D</code> and the specified <code>Point2D</code>.
     * <p>
     * After adding a point, a call to <code>contains</code> with the added
     * point as an argument does not necessarily return <code>true</code>. The
     * <code>contains</code> method does not return <code>true</code> for points
     * on the right or bottom edges of a rectangle. Therefore, if the added
     * point falls on the left or bottom edge of the enlarged rectangle,
     * <code>contains</code> returns <code>false</code> for that point.
     *
     * @param {Point2D} pt
     * the new <code>Point2D</code> to add to this
     * <code>Rectangle2D</code>.
     * @since 1.2
     */
    add$java_awt_geom_Point2D(pt: Point2D): void;
    /**
     * Adds a <code>Rectangle2D</code> object to this <code>Rectangle2D</code>.
     * The resulting <code>Rectangle2D</code> is the union of the two
     * <code>Rectangle2D</code> objects.
     *
     * @param {Rectangle2D} r
     * the <code>Rectangle2D</code> to add to this
     * <code>Rectangle2D</code>.
     * @since 1.2
     */
    add$java_awt_geom_Rectangle2D(r: Rectangle2D): void;
    /**
     * Returns an iteration object that defines the boundary of this
     * <code>Rectangle2D</code>. The iterator for this class is multi-threaded
     * safe, which means that this <code>Rectangle2D</code> class guarantees
     * that modifications to the geometry of this <code>Rectangle2D</code>
     * object do not affect any iterations of that geometry that are already in
     * process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Rectangle2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of the flattened
     * <code>Rectangle2D</code>. Since rectangles are already flat, the
     * <code>flatness</code> parameter is ignored. The iterator for this class
     * is multi-threaded safe, which means that this <code>Rectangle2D</code>
     * class guarantees that modifications to the geometry of this
     * <code>Rectangle2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum distance that the line segments used to
     * approximate the curved segments are allowed to deviate from
     * any point on the original curve. Since rectangles are already
     * flat, the <code>flatness</code> parameter is ignored.
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Rectangle2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform$double(at: AffineTransform, flatness: number): PathIterator;
    /**
     * Returns an iteration object that defines the boundary of the flattened
     * <code>Rectangle2D</code>. Since rectangles are already flat, the
     * <code>flatness</code> parameter is ignored. The iterator for this class
     * is multi-threaded safe, which means that this <code>Rectangle2D</code>
     * class guarantees that modifications to the geometry of this
     * <code>Rectangle2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @param {number} flatness
     * the maximum distance that the line segments used to
     * approximate the curved segments are allowed to deviate from
     * any point on the original curve. Since rectangles are already
     * flat, the <code>flatness</code> parameter is ignored.
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>Rectangle2D</code>, one segment at a
     * time.
     * @since 1.2
     */
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Determines whether or not the specified <code>Object</code> is equal to
     * this <code>Rectangle2D</code>. The specified <code>Object</code> is equal
     * to this <code>Rectangle2D</code> if it is an instance of
     * <code>Rectangle2D</code> and if its location and size are the same as
     * this <code>Rectangle2D</code>.
     *
     * @param {*} obj
     * an <code>Object</code> to be compared with this
     * <code>Rectangle2D</code>.
     * @return {boolean} <code>true</code> if <code>obj</code> is an instance of
     * <code>Rectangle2D</code> and has the same values;
     * <code>false</code> otherwise.
     * @since 1.2
     */
    equals(obj: any): boolean;
}
declare namespace Rectangle2D {
    /**
     * Constructs and initializes a <code>Rectangle2D</code> from the
     * specified <code>float</code> coordinates.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the newly
     * constructed <code>Rectangle2D</code>
     * @param {number} y
     * the Y coordinate of the upper-left corner of the newly
     * constructed <code>Rectangle2D</code>
     * @param {number} w
     * the width of the newly constructed
     * <code>Rectangle2D</code>
     * @param {number} h
     * the height of the newly constructed
     * <code>Rectangle2D</code>
     * @since 1.2
     * @class
     */
    class Float extends Rectangle2D {
        /**
         * The X coordinate of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The width of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The height of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        constructor(x?: any, y?: any, w?: any, h?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location and size of this <code>Rectangle2D</code> to the
         * specified <code>float</code> values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} y
         * the Y coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} w
         * the width of this <code>Rectangle2D</code>
         * @param {number} h
         * the height of this <code>Rectangle2D</code>
         * @since 1.2
         */
        setRect$float$float$float$float(x: number, y: number, w: number, h: number): void;
        /**
         * Sets the location and size of this <code>Rectangle2D</code> to the
         * specified <code>float</code> values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} y
         * the Y coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} w
         * the width of this <code>Rectangle2D</code>
         * @param {number} h
         * the height of this <code>Rectangle2D</code>
         * @since 1.2
         */
        setRect(x?: any, y?: any, w?: any, h?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        setRect$double$double$double$double(x: number, y: number, w: number, h: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         */
        setRect$java_awt_geom_Rectangle2D(r: Rectangle2D): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @return {number}
         */
        outcode$double$double(x: number, y: number): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @return {number}
         */
        outcode(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         * @return {Rectangle2D}
         */
        createIntersection(r: Rectangle2D): Rectangle2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         * @return {Rectangle2D}
         */
        createUnion(r: Rectangle2D): Rectangle2D;
        /**
         * Returns the <code>String</code> representation of this
         * <code>Rectangle2D</code>.
         *
         * @return {string} a <code>String</code> representing this
         * <code>Rectangle2D</code>.
         * @since 1.2
         */
        toString(): string;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a <code>Rectangle2D</code> from the
     * specified <code>double</code> coordinates.
     *
     * @param {number} x
     * the X coordinate of the upper-left corner of the newly
     * constructed <code>Rectangle2D</code>
     * @param {number} y
     * the Y coordinate of the upper-left corner of the newly
     * constructed <code>Rectangle2D</code>
     * @param {number} w
     * the width of the newly constructed
     * <code>Rectangle2D</code>
     * @param {number} h
     * the height of the newly constructed
     * <code>Rectangle2D</code>
     * @since 1.2
     * @class
     */
    class Double extends Rectangle2D {
        /**
         * The X coordinate of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The width of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The height of this <code>Rectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        constructor(x?: any, y?: any, w?: any, h?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location and size of this <code>Rectangle2D</code> to the
         * specified <code>float</code> values.
         *
         * @param {number} x
         * the X coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} y
         * the Y coordinate of the upper-left corner of this
         * <code>Rectangle2D</code>
         * @param {number} w
         * the width of this <code>Rectangle2D</code>
         * @param {number} h
         * the height of this <code>Rectangle2D</code>
         * @since 1.2
         */
        setRect(x?: any, y?: any, w?: any, h?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        setRect$double$double$double$double(x: number, y: number, w: number, h: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         */
        setRect$java_awt_geom_Rectangle2D(r: Rectangle2D): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @return {number}
         */
        outcode$double$double(x: number, y: number): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @return {number}
         */
        outcode(x?: any, y?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         * @return {Rectangle2D}
         */
        createIntersection(r: Rectangle2D): Rectangle2D;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {Rectangle2D} r
         * @return {Rectangle2D}
         */
        createUnion(r: Rectangle2D): Rectangle2D;
        /**
         * Returns the <code>String</code> representation of this
         * <code>Rectangle2D</code>.
         *
         * @return {string} a <code>String</code> representing this
         * <code>Rectangle2D</code>.
         * @since 1.2
         */
        toString(): string;
        static serialVersionUID: number;
    }
}
/**
 * This is an abstract class that cannot be instantiated directly.
 * Type-specific implementation subclasses are available for instantiation
 * and provide a number of formats for storing the information necessary to
 * satisfy the various accessor methods below.
 *
 * @see java.awt.geom.RoundRectangle2D.Float
 * @see java.awt.geom.RoundRectangle2D.Double
 * @since 1.2
 * @class
 */
declare abstract class RoundRectangle2D extends RectangularShape {
    constructor();
    /**
     * Gets the width of the arc that rounds off the corners.
     *
     * @return {number} the width of the arc that rounds off the corners of this
     * <code>RoundRectangle2D</code>.
     * @since 1.2
     */
    abstract getArcWidth(): number;
    /**
     * Gets the height of the arc that rounds off the corners.
     *
     * @return {number} the height of the arc that rounds off the corners of this
     * <code>RoundRectangle2D</code>.
     * @since 1.2
     */
    abstract getArcHeight(): number;
    /**
     * Sets the location, size, and corner radii of this
     * <code>RoundRectangle2D</code> to the specified <code>float</code>
     * values.
     *
     * @param {number} x
     * the X coordinate to which to set the location of this
     * <code>RoundRectangle2D</code>
     * @param {number} y
     * the Y coordinate to which to set the location of this
     * <code>RoundRectangle2D</code>
     * @param {number} w
     * the width to which to set this
     * <code>RoundRectangle2D</code>
     * @param {number} h
     * the height to which to set this
     * <code>RoundRectangle2D</code>
     * @param {number} arcw
     * the width to which to set the arc of this
     * <code>RoundRectangle2D</code>
     * @param {number} arch
     * the height to which to set the arc of this
     * <code>RoundRectangle2D</code>
     * @since 1.2
     */
    setRoundRect(x?: any, y?: any, w?: any, h?: any, arcw?: any, arch?: any): any;
    /**
     * Sets the location, size, and corner radii of this
     * <code>RoundRectangle2D</code> to the specified <code>double</code>
     * values.
     *
     * @param {number} x
     * the X coordinate to which to set the location of this
     * <code>RoundRectangle2D</code>
     * @param {number} y
     * the Y coordinate to which to set the location of this
     * <code>RoundRectangle2D</code>
     * @param {number} w
     * the width to which to set this <code>RoundRectangle2D</code>
     * @param {number} h
     * the height to which to set this <code>RoundRectangle2D</code>
     * @param {number} arcWidth
     * the width to which to set the arc of this
     * <code>RoundRectangle2D</code>
     * @param {number} arcHeight
     * the height to which to set the arc of this
     * <code>RoundRectangle2D</code>
     * @since 1.2
     */
    setRoundRect$double$double$double$double$double$double(x: number, y: number, w: number, h: number, arcWidth: number, arcHeight: number): void;
    /**
     * Sets this <code>RoundRectangle2D</code> to be the same as the specified
     * <code>RoundRectangle2D</code>.
     *
     * @param {RoundRectangle2D} rr
     * the specified <code>RoundRectangle2D</code>
     * @since 1.2
     */
    setRoundRect$java_awt_geom_RoundRectangle2D(rr: RoundRectangle2D): void;
    setFrame(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setFrame$double$double$double$double(x: number, y: number, w: number, h: number): void;
    contains(x?: any, y?: any, w?: any, h?: any, origrect?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    contains$double$double(x: number, y: number): boolean;
    classify(coord: number, left: number, right: number, arcsize: number): number;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    intersects(x?: any, y?: any, w?: any, h?: any): any;
    /**
     * {@inheritDoc}
     *
     * @since 1.2
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @return {boolean}
     */
    contains$double$double$double$double(x: number, y: number, w: number, h: number): boolean;
    getPathIterator(at?: any, flatness?: any): any;
    /**
     * Returns an iteration object that defines the boundary of this
     * <code>RoundRectangle2D</code>. The iterator for this class is
     * multi-threaded safe, which means that this <code>RoundRectangle2D</code>
     * class guarantees that modifications to the geometry of this
     * <code>RoundRectangle2D</code> object do not affect any iterations of that
     * geometry that are already in process.
     *
     * @param {AffineTransform} at
     * an optional <code>AffineTransform</code> to be applied to the
     * coordinates as they are returned in the iteration, or
     * <code>null</code> if untransformed coordinates are desired
     * @return {PathIterator} the <code>PathIterator</code> object that returns the geometry of
     * the outline of this <code>RoundRectangle2D</code>, one segment at
     * a time.
     * @since 1.2
     */
    getPathIterator$java_awt_geom_AffineTransform(at: AffineTransform): PathIterator;
    /**
     * Determines whether or not the specified <code>Object</code> is equal to
     * this <code>RoundRectangle2D</code>. The specified <code>Object</code> is
     * equal to this <code>RoundRectangle2D</code> if it is an instance of
     * <code>RoundRectangle2D</code> and if its location, size, and corner arc
     * dimensions are the same as this <code>RoundRectangle2D</code>.
     *
     * @param {*} obj
     * an <code>Object</code> to be compared with this
     * <code>RoundRectangle2D</code>.
     * @return {boolean} <code>true</code> if <code>obj</code> is an instance of
     * <code>RoundRectangle2D</code> and has the same values;
     * <code>false</code> otherwise.
     * @since 1.6
     */
    equals(obj: any): boolean;
}
declare namespace RoundRectangle2D {
    /**
     * Constructs and initializes a <code>RoundRectangle2D</code> from the
     * specified <code>float</code> coordinates.
     *
     * @param {number} x
     * the X coordinate of the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} y
     * the Y coordinate of the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} w
     * the width to which to set the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} h
     * the height to which to set the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} arcw
     * the width of the arc to use to round off the corners of
     * the newly constructed <code>RoundRectangle2D</code>
     * @param {number} arch
     * the height of the arc to use to round off the corners of
     * the newly constructed <code>RoundRectangle2D</code>
     * @since 1.2
     * @class
     */
    class Float extends RoundRectangle2D {
        /**
         * The X coordinate of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The width of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The height of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        /**
         * The width of the arc that rounds off the corners.
         *
         * @since 1.2
         * @serial
         */
        arcwidth: number;
        /**
         * The height of the arc that rounds off the corners.
         *
         * @since 1.2
         * @serial
         */
        archeight: number;
        constructor(x?: any, y?: any, w?: any, h?: any, arcw?: any, arch?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getArcWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getArcHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location, size, and corner radii of this
         * <code>RoundRectangle2D</code> to the specified <code>float</code>
         * values.
         *
         * @param {number} x
         * the X coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} y
         * the Y coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} w
         * the width to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} h
         * the height to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} arcw
         * the width to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @param {number} arch
         * the height to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @since 1.2
         */
        setRoundRect$float$float$float$float$float$float(x: number, y: number, w: number, h: number, arcw: number, arch: number): void;
        /**
         * Sets the location, size, and corner radii of this
         * <code>RoundRectangle2D</code> to the specified <code>float</code>
         * values.
         *
         * @param {number} x
         * the X coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} y
         * the Y coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} w
         * the width to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} h
         * the height to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} arcw
         * the width to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @param {number} arch
         * the height to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @since 1.2
         */
        setRoundRect(x?: any, y?: any, w?: any, h?: any, arcw?: any, arch?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} arcw
         * @param {number} arch
         */
        setRoundRect$double$double$double$double$double$double(x: number, y: number, w: number, h: number, arcw: number, arch: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {RoundRectangle2D} rr
         */
        setRoundRect$java_awt_geom_RoundRectangle2D(rr: RoundRectangle2D): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
    /**
     * Constructs and initializes a <code>RoundRectangle2D</code> from the
     * specified <code>double</code> coordinates.
     *
     * @param {number} x
     * the X coordinate of the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} y
     * the Y coordinate of the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} w
     * the width to which to set the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} h
     * the height to which to set the newly constructed
     * <code>RoundRectangle2D</code>
     * @param {number} arcw
     * the width of the arc to use to round off the corners of
     * the newly constructed <code>RoundRectangle2D</code>
     * @param {number} arch
     * the height of the arc to use to round off the corners of
     * the newly constructed <code>RoundRectangle2D</code>
     * @since 1.2
     * @class
     */
    class Double extends RoundRectangle2D {
        /**
         * The X coordinate of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        x: number;
        /**
         * The Y coordinate of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        y: number;
        /**
         * The width of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        width: number;
        /**
         * The height of this <code>RoundRectangle2D</code>.
         *
         * @since 1.2
         * @serial
         */
        height: number;
        /**
         * The width of the arc that rounds off the corners.
         *
         * @since 1.2
         * @serial
         */
        arcwidth: number;
        /**
         * The height of the arc that rounds off the corners.
         *
         * @since 1.2
         * @serial
         */
        archeight: number;
        constructor(x?: any, y?: any, w?: any, h?: any, arcw?: any, arch?: any);
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getX(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getY(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getArcWidth(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {number}
         */
        getArcHeight(): number;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {boolean}
         */
        isEmpty(): boolean;
        /**
         * Sets the location, size, and corner radii of this
         * <code>RoundRectangle2D</code> to the specified <code>float</code>
         * values.
         *
         * @param {number} x
         * the X coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} y
         * the Y coordinate to which to set the location of this
         * <code>RoundRectangle2D</code>
         * @param {number} w
         * the width to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} h
         * the height to which to set this
         * <code>RoundRectangle2D</code>
         * @param {number} arcw
         * the width to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @param {number} arch
         * the height to which to set the arc of this
         * <code>RoundRectangle2D</code>
         * @since 1.2
         */
        setRoundRect(x?: any, y?: any, w?: any, h?: any, arcw?: any, arch?: any): any;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} arcw
         * @param {number} arch
         */
        setRoundRect$double$double$double$double$double$double(x: number, y: number, w: number, h: number, arcw: number, arch: number): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @param {RoundRectangle2D} rr
         */
        setRoundRect$java_awt_geom_RoundRectangle2D(rr: RoundRectangle2D): void;
        /**
         * {@inheritDoc}
         *
         * @since 1.2
         * @return {Rectangle2D}
         */
        getBounds2D(): Rectangle2D;
        static serialVersionUID: number;
    }
}
declare namespace javaemul.internal {
    /**
     * Wraps a primitive <code>double</code> as an object.
     * @extends javaemul.internal.NumberHelper
     */
    class DoubleHelper extends javaemul.internal.NumberHelper {
        static MAX_VALUE: number;
        static MIN_VALUE: number;
        static MIN_NORMAL: number;
        static MAX_EXPONENT: number;
        static MIN_EXPONENT: number;
        static NaN: number;
        static NaN_$LI$(): number;
        static NEGATIVE_INFINITY: number;
        static NEGATIVE_INFINITY_$LI$(): number;
        static POSITIVE_INFINITY: number;
        static POSITIVE_INFINITY_$LI$(): number;
        static SIZE: number;
        static POWER_512: number;
        static POWER_MINUS_512: number;
        static POWER_256: number;
        static POWER_MINUS_256: number;
        static POWER_128: number;
        static POWER_MINUS_128: number;
        static POWER_64: number;
        static POWER_MINUS_64: number;
        static POWER_52: number;
        static POWER_MINUS_52: number;
        static POWER_32: number;
        static POWER_MINUS_32: number;
        static POWER_31: number;
        static POWER_20: number;
        static POWER_MINUS_20: number;
        static POWER_16: number;
        static POWER_MINUS_16: number;
        static POWER_8: number;
        static POWER_MINUS_8: number;
        static POWER_4: number;
        static POWER_MINUS_4: number;
        static POWER_2: number;
        static POWER_MINUS_2: number;
        static POWER_1: number;
        static POWER_MINUS_1: number;
        static POWER_MINUS_1022: number;
        static compare(x: number, y: number): number;
        static doubleToLongBits(value: number): number;
        /**
         * @skip Here for shared implementation with Arrays.hashCode
         * @param {number} d
         * @return {number}
         */
        static hashCode(d: number): number;
        static isInfinite(x: number): boolean;
        static isNaN(x: number): boolean;
        static longBitsToDouble(bits: number): number;
        static parseDouble(s: string): number;
        static toString(b: number): string;
        constructor();
    }
    namespace DoubleHelper {
        class PowersTable {
            static powers: number[];
            static powers_$LI$(): number[];
            static invPowers: number[];
            static invPowers_$LI$(): number[];
        }
    }
}
declare namespace sun.awt.geom {
    class Order0 extends sun.awt.geom.Curve {
        x: number;
        y: number;
        constructor(x: number, y: number);
        getOrder(): number;
        getXTop(): number;
        getYTop(): number;
        getXBot(): number;
        getYBot(): number;
        getXMin(): number;
        getXMax(): number;
        getX0(): number;
        getY0(): number;
        getX1(): number;
        getY1(): number;
        XforY(y: number): number;
        TforY(y: number): number;
        XforT(t: number): number;
        YforT(t: number): number;
        dXforT(t: number, deriv: number): number;
        dYforT(t: number, deriv: number): number;
        nextVertical(t0: number, t1: number): number;
        crossingsFor(x: number, y: number): number;
        accumulateCrossings(c: sun.awt.geom.Crossings): boolean;
        enlarge(r: Rectangle2D): void;
        getSubCurve$double$double$int(ystart: number, yend: number, dir: number): sun.awt.geom.Curve;
        getSubCurve(ystart?: any, yend?: any, dir?: any): any;
        getReversedCurve(): sun.awt.geom.Curve;
        getSegment(coords: number[]): number;
    }
}
declare namespace sun.awt.geom {
    class Order1 extends sun.awt.geom.Curve {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        xmin: number;
        xmax: number;
        constructor(x0: number, y0: number, x1: number, y1: number, direction: number);
        getOrder(): number;
        getXTop(): number;
        getYTop(): number;
        getXBot(): number;
        getYBot(): number;
        getXMin(): number;
        getXMax(): number;
        getX0(): number;
        getY0(): number;
        getX1(): number;
        getY1(): number;
        XforY(y: number): number;
        TforY(y: number): number;
        XforT(t: number): number;
        YforT(t: number): number;
        dXforT(t: number, deriv: number): number;
        dYforT(t: number, deriv: number): number;
        nextVertical(t0: number, t1: number): number;
        accumulateCrossings(c: sun.awt.geom.Crossings): boolean;
        enlarge(r: Rectangle2D): void;
        getSubCurve$double$double$int(ystart: number, yend: number, dir: number): sun.awt.geom.Curve;
        getSubCurve(ystart?: any, yend?: any, dir?: any): any;
        getReversedCurve(): sun.awt.geom.Curve;
        compareTo(other: sun.awt.geom.Curve, yrange: number[]): number;
        getSegment(coords: number[]): number;
    }
}
declare namespace sun.awt.geom {
    class Order2 extends sun.awt.geom.Curve {
        x0: number;
        y0: number;
        cx0: number;
        cy0: number;
        x1: number;
        y1: number;
        xmin: number;
        xmax: number;
        xcoeff0: number;
        xcoeff1: number;
        xcoeff2: number;
        ycoeff0: number;
        ycoeff1: number;
        ycoeff2: number;
        static insert(curves: Array<any>, tmp: number[], x0: number, y0: number, cx0: number, cy0: number, x1: number, y1: number, direction: number): void;
        static addInstance(curves: Array<any>, x0: number, y0: number, cx0: number, cy0: number, x1: number, y1: number, direction: number): void;
        static getHorizontalParams(c0: number, cp: number, c1: number, ret: number[]): number;
        static split(coords: number[], pos: number, t: number): void;
        constructor(x0: number, y0: number, cx0: number, cy0: number, x1: number, y1: number, direction: number);
        getOrder(): number;
        getXTop(): number;
        getYTop(): number;
        getXBot(): number;
        getYBot(): number;
        getXMin(): number;
        getXMax(): number;
        getX0(): number;
        getY0(): number;
        getCX0(): number;
        getCY0(): number;
        getX1(): number;
        getY1(): number;
        XforY(y: number): number;
        TforY(y: number): number;
        static TforY(y: number, ycoeff0: number, ycoeff1: number, ycoeff2: number): number;
        XforT(t: number): number;
        YforT(t: number): number;
        dXforT(t: number, deriv: number): number;
        dYforT(t: number, deriv: number): number;
        nextVertical(t0: number, t1: number): number;
        enlarge(r: Rectangle2D): void;
        getSubCurve$double$double$int(ystart: number, yend: number, dir: number): sun.awt.geom.Curve;
        getSubCurve(ystart?: any, yend?: any, dir?: any): any;
        getReversedCurve(): sun.awt.geom.Curve;
        getSegment(coords: number[]): number;
        controlPointString(): string;
    }
}
declare namespace sun.awt.geom {
    class Order3 extends sun.awt.geom.Curve {
        x0: number;
        y0: number;
        cx0: number;
        cy0: number;
        cx1: number;
        cy1: number;
        x1: number;
        y1: number;
        xmin: number;
        xmax: number;
        xcoeff0: number;
        xcoeff1: number;
        xcoeff2: number;
        xcoeff3: number;
        ycoeff0: number;
        ycoeff1: number;
        ycoeff2: number;
        ycoeff3: number;
        static insert(curves: Array<any>, tmp: number[], x0: number, y0: number, cx0: number, cy0: number, cx1: number, cy1: number, x1: number, y1: number, direction: number): void;
        static addInstance(curves: Array<any>, x0: number, y0: number, cx0: number, cy0: number, cx1: number, cy1: number, x1: number, y1: number, direction: number): void;
        static getHorizontalParams(c0: number, cp0: number, cp1: number, c1: number, ret: number[]): number;
        static split(coords: number[], pos: number, t: number): void;
        constructor(x0: number, y0: number, cx0: number, cy0: number, cx1: number, cy1: number, x1: number, y1: number, direction: number);
        getOrder(): number;
        getXTop(): number;
        getYTop(): number;
        getXBot(): number;
        getYBot(): number;
        getXMin(): number;
        getXMax(): number;
        getX0(): number;
        getY0(): number;
        getCX0(): number;
        getCY0(): number;
        getCX1(): number;
        getCY1(): number;
        getX1(): number;
        getY1(): number;
        TforY1: number;
        YforT1: number;
        TforY2: number;
        YforT2: number;
        TforY3: number;
        YforT3: number;
        TforY(y: number): number;
        refine(a: number, b: number, c: number, target: number, t: number): number;
        XforY(y: number): number;
        XforT(t: number): number;
        YforT(t: number): number;
        dXforT(t: number, deriv: number): number;
        dYforT(t: number, deriv: number): number;
        nextVertical(t0: number, t1: number): number;
        enlarge(r: Rectangle2D): void;
        getSubCurve$double$double$int(ystart: number, yend: number, dir: number): sun.awt.geom.Curve;
        getSubCurve(ystart?: any, yend?: any, dir?: any): any;
        getReversedCurve(): sun.awt.geom.Curve;
        getSegment(coords: number[]): number;
        controlPointString(): string;
    }
}
declare namespace sun.awt.geom {
    abstract class AreaOp {
        verbose: boolean;
        constructor();
        static CTAG_LEFT: number;
        static CTAG_RIGHT: number;
        static ETAG_IGNORE: number;
        static ETAG_ENTER: number;
        static ETAG_EXIT: number;
        static RSTAG_INSIDE: number;
        static RSTAG_OUTSIDE: number;
        abstract newRow(): any;
        abstract classify(e: sun.awt.geom.Edge): number;
        abstract getState(): number;
        calculate(left: Array<any>, right: Array<any>): Array<any>;
        static addEdges(edges: Array<any>, curves: Array<sun.awt.geom.Curve>, curvetag: number): void;
        static YXTopComparator: any;
        static YXTopComparator_$LI$(): any;
        pruneEdges(edges: Array<any>): Array<any>;
        static finalizeSubCurves(subcurves: Array<any>, chains: Array<any>): void;
        static EmptyLinkList: sun.awt.geom.CurveLink[];
        static EmptyLinkList_$LI$(): sun.awt.geom.CurveLink[];
        static EmptyChainList: sun.awt.geom.ChainEnd[];
        static EmptyChainList_$LI$(): sun.awt.geom.ChainEnd[];
        static resolveLinks(subcurves: Array<any>, chains: Array<any>, links: Array<any>): void;
        static obstructs(v1: number, v2: number, phase: number): boolean;
    }
    namespace AreaOp {
        abstract class CAGOp extends sun.awt.geom.AreaOp {
            inLeft: boolean;
            inRight: boolean;
            inResult: boolean;
            newRow(): void;
            classify(e: sun.awt.geom.Edge): number;
            getState(): number;
            abstract newClassification(inLeft: boolean, inRight: boolean): boolean;
            constructor();
        }
        class AddOp extends AreaOp.CAGOp {
            newClassification(inLeft: boolean, inRight: boolean): boolean;
        }
        class SubOp extends AreaOp.CAGOp {
            newClassification(inLeft: boolean, inRight: boolean): boolean;
        }
        class IntOp extends AreaOp.CAGOp {
            newClassification(inLeft: boolean, inRight: boolean): boolean;
        }
        class XorOp extends AreaOp.CAGOp {
            newClassification(inLeft: boolean, inRight: boolean): boolean;
        }
        class NZWindOp extends sun.awt.geom.AreaOp {
            count: number;
            newRow(): void;
            classify(e: sun.awt.geom.Edge): number;
            getState(): number;
            constructor();
        }
        class EOWindOp extends sun.awt.geom.AreaOp {
            inside: boolean;
            newRow(): void;
            classify(e: sun.awt.geom.Edge): number;
            getState(): number;
            constructor();
        }
    }
}
/**
 * The {@code GeneralPath} class represents a geometric path constructed from
 * straight lines, and quadratic and cubic (B&eacute;zier) curves. It can
 * contain multiple subpaths.
 * <p>
 * {@code GeneralPath} is a legacy final class which exactly implements the
 * behavior of its superclass {@link Path2D.Float}. Together with
 * {@link Path2D.Double}, the {@link Path2D} classes provide full
 * implementations of a general geometric path that support all of the
 * functionality of the {@link Shape} and {@link PathIterator} interfaces with
 * the ability to explicitly select different levels of internal coordinate
 * precision.
 * <p>
 * Use {@code Path2D.Float} (or this legacy {@code GeneralPath} subclass) when
 * dealing with data that can be represented and used with floating point
 * precision. Use {@code Path2D.Double} for data that requires the accuracy or
 * range of double precision.
 *
 * @author Jim Graham
 * @since 1.2
 * @extends Path2D.Float
 */
declare class GeneralPath extends Path2D.Float {
    constructor(windingRule?: any, pointTypes?: any, numTypes?: any, pointCoords?: any, numCoords?: any);
    static serialVersionUID: number;
}
