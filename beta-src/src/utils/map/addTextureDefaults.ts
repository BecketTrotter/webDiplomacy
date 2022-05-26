import Country from "../../enums/Country";
import { Texture } from "../../interfaces/map/Texture";
import webDiplomacyTheme from "../../webDiplomacyTheme";

const addTextureDefaults = (texture?: Texture) => {
  if (!texture) {
    return texture;
  }
  let textureStroke;
  return {
    texture: texture.texture,
    stroke: texture.stroke || textureStroke,
    strokeOpacity: texture.strokeOpacity || 0.5,
    strokeWidth: texture.strokeWidth || 7,
  };
};

export default addTextureDefaults;
