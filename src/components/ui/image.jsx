import * as React from "react"

/**
 * Imagen simple: todas las imágenes del proyecto son locales
 * (src/assets) y las empaqueta Vite, así que no hace falta ninguna
 * transformación remota. Se mantiene el mismo nombre y API para que los
 * componentes que ya usan <Image /> sigan funcionando igual.
 */
const Image = React.forwardRef(
  ({ src, fittingType: _fittingType, originWidth: _ow, originHeight: _oh, focalPointX: _fx, focalPointY: _fy, quality: _q, ...props }, ref) => (
    <img ref={ref} src={src} {...props} />
  )
)
Image.displayName = "Image"

export { Image }