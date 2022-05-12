import TerritoryMap from "../../data/map/variants/classic/TerritoryMap";
import ArrowColor from "../../enums/ArrowColor";
import ArrowType from "../../enums/ArrowType";
import GameDataResponse from "../../state/interfaces/GameDataResponse";
import { GameState } from "../../state/interfaces/GameState";
import GameStateMaps from "../../state/interfaces/GameStateMaps";
import OrdersMeta from "../../state/interfaces/SavedOrders";
import drawArrow from "./drawArrow";

export default function drawSupportMoveOrders(
  data: GameDataResponse["data"],
  maps: GameStateMaps,
  ordersMeta: OrdersMeta,
  ownUnits: GameState["ownUnits"],
): void {
  const { currentOrders, territories, units } = data;
  const ordersMetaEntries = Object.entries(ordersMeta);
  if (ordersMetaEntries.length && units && territories) {
    ordersMetaEntries
      .filter(([, { update }]) => update?.type === "Support move")
      .forEach(([orderID, { update }]) => {
        const originalOrder = currentOrders?.find(({ id }) => id === orderID);
        if (originalOrder && update) {
          const { fromTerrID, toTerrID } = update;
          if (fromTerrID && toTerrID) {
            const { id, unitID } = originalOrder;

            const unitBeingSupported = maps.territoryToUnit[fromTerrID];
            const unitBeingSupportedOrder =
              maps.unitToOrder[unitBeingSupported];

            const supportingTerritory = maps.unitToTerritory[unitID];
            const supportingTerritoryDetails = territories[supportingTerritory];
            if (!ownUnits.includes(unitBeingSupported)) {
              const supportArrowIdentifer = `${id}-foreign`;
              drawArrow(
                supportArrowIdentifer,
                ArrowType.MOVE,
                ArrowColor.IMPLIED_FOREIGN,
                "territory",
                TerritoryMap[territories[toTerrID].name].territory,
                TerritoryMap[territories[fromTerrID].name].territory,
              );
              drawArrow(
                id,
                ArrowType.SUPPORT,
                ArrowColor.SUPPORT_MOVE,
                "arrow",
                supportArrowIdentifer,
                TerritoryMap[supportingTerritoryDetails.name].territory,
              );
            } else {
              // update: unitBeingSupportedOrderDetails will throw an error if the unit being supported
              // is not your own unit, which is why it is only run after doing an appropriate check
              // (above if statement)
              const { update: unitBeingSupportedOrderDetails } =
                ordersMeta[unitBeingSupportedOrder];
              if (unitBeingSupportedOrderDetails) {
                const {
                  type: supportedUnitActualOrderType,
                  toTerrID: supportedUnitToTerrID,
                } = unitBeingSupportedOrderDetails;
                let supportArrowIdentifer = unitBeingSupportedOrder;
                if (
                  supportedUnitActualOrderType !== "Move" ||
                  supportedUnitToTerrID !== toTerrID
                ) {
                  supportArrowIdentifer = `${id}-implied`;
                  drawArrow(
                    supportArrowIdentifer,
                    ArrowType.MOVE,
                    ArrowColor.IMPLIED,
                    "territory",
                    TerritoryMap[territories[toTerrID].name].territory,
                    TerritoryMap[territories[fromTerrID].name].territory,
                  );
                }
                drawArrow(
                  id,
                  ArrowType.SUPPORT,
                  ArrowColor.SUPPORT_MOVE,
                  "arrow",
                  supportArrowIdentifer,
                  TerritoryMap[supportingTerritoryDetails.name].territory,
                );
              }
            }
          }
        }
      });
  }
}