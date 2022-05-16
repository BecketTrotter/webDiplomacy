import { current } from "@reduxjs/toolkit";
import Territory from "../../enums/map/variants/classic/Territory";
import OrderClass from "../../models/OrderClass";
import { GameCommand } from "../../state/interfaces/GameCommands";
import updateOrdersMeta from "./updateOrdersMeta";
import setCommand from "./setCommand";

/* eslint-disable no-param-reassign */
export default function processForeignConvoy(state): void {
  const {
    board,
    data: {
      data: { currentOrders },
    },
    order,
    ordersMeta,
    maps,
  } = current(state);
  const lastUnitInChain =
    order.subsequentClicks[order.subsequentClicks.length - 1];

  if (lastUnitInChain) {
    const { convoyToChoices } = ordersMeta[lastUnitInChain.order];
    const toTerritory = maps.enumToTerritory[order.toTerritory];
    const fromTerritory = maps.enumToTerritory[lastUnitInChain.onTerritory];

    if (convoyToChoices.includes(toTerritory)) {
      // const orderUnit = board.findUnitByID(lastUnitInChain.unitID);
      const fleetOrder = currentOrders?.find((o) => o.unitID === order.unitID);
      if (fleetOrder) {
        const fleetUnit = board.findUnitByID(order.unitID);
        const convoyOrder = new OrderClass(board, fleetOrder, fleetUnit);
        const againstTerritory = board.findTerritoryByID(toTerritory);
        const convoyFrom = convoyOrder.getConvoyFromChoices(againstTerritory);

        const convoyArmy = convoyFrom.find(
          (c) => c.id === lastUnitInChain.unitID,
        );

        if (convoyArmy) {
          const convoyPath = convoyArmy.ConvoyGroup.pathArmyToCoastWithFleet(
            board.findTerritoryByID(fromTerritory),
            againstTerritory,
            convoyOrder.unit.Territory,
          );

          if (convoyPath) {
            const clickedUnitsTerritories = order.subsequentClicks.map(
              (click) => {
                return maps.enumToTerritory[click.onTerritory];
              },
            );
            clickedUnitsTerritories.push(
              maps.enumToTerritory[order.onTerritory],
            );
            const updates = {};
            convoyPath.forEach((terrID) => {
              let foundClick =
                maps.enumToTerritory[order.onTerritory] === terrID
                  ? order
                  : false;
              if (!foundClick) {
                foundClick = order.subsequentClicks.find((click) => {
                  return maps.enumToTerritory[click.onTerritory] === terrID;
                });
              }
              if (!foundClick) {
                // user did not click this unit
              } else {
                const unitOrderID = maps.unitToOrder[foundClick.unitID];
                const unitIsArmy =
                  board.findUnitByID(foundClick.unitID).type === "Army";
                if (unitIsArmy) {
                  // unitOrderID is undefined because its a foreign unit.
                  updates[unitOrderID] = {
                    saved: false,
                    update: {
                      convoyPath,
                      toTerrID: toTerritory,
                      fromTerrID: fromTerritory,
                      type: "Move",
                      viaConvoy: "Yes",
                    },
                  };
                } else {
                  updates[unitOrderID] = {
                    saved: false,
                    update: {
                      convoyPath,
                      toTerrID: toTerritory,
                      fromTerrID: fromTerritory,
                      type: "Convoy",
                    },
                  };
                }
              }
            });
            updateOrdersMeta(state, updates);
            const command: GameCommand = {
              command: "MOVE",
            };
            setCommand(
              state,
              command,
              "territoryCommands",
              Territory[order.toTerritory],
            );
          }
        }
      }
      return;
    }
  }
  const command: GameCommand = {
    command: "INVALID_CLICK",
  };
  setCommand(state, command, "territoryCommands", Territory[order.toTerritory]);
}
