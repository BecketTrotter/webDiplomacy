import { useTheme } from "@mui/material";
import * as React from "react";
import countryMap from "../../../data/map/variants/classic/CountryMap";
import TerritoryMap from "../../../data/map/variants/classic/TerritoryMap";
import Territories from "../../../data/Territories";
import UIState from "../../../enums/UIState";
import { Coordinates, TerritoryMapData } from "../../../interfaces";
import {
  gameApiSliceActions,
  gameOrder,
  gameOrdersMeta,
  gameOverview,
  gameTerritoriesMeta,
  gameUnitState,
} from "../../../state/game/game-api-slice";
import { useAppDispatch, useAppSelector } from "../../../state/hooks";
import { TerritoryMeta } from "../../../state/interfaces/TerritoriesState";
import ClickObjectType from "../../../types/state/ClickObjectType";
import OrderType from "../../../types/state/OrderType";
import UnitType from "../../../types/UnitType";
import WDUnit, { UNIT_HEIGHT, UNIT_WIDTH } from "../../ui/units/WDUnit";
import WDCenter from "./WDCenter";
import WDLabel from "./WDLabel";
import WDUnitSlot from "./WDUnitSlot";
import { Unit } from "../../../utils/map/getUnits";
import Territory from "../../../enums/map/variants/classic/Territory";

interface WDTerritoryProps {
  territoryMapData: TerritoryMapData;
  units: Unit[];
}

const WDTerritory: React.FC<WDTerritoryProps> = function ({
  territoryMapData,
  units,
}): React.ReactElement {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const territoriesMeta = useAppSelector(gameTerritoriesMeta);

  const { user, members } = useAppSelector(gameOverview);
  const userCountry = countryMap[user.member.country];

  const { territory } = territoryMapData;
  const territoryMeta = territoriesMeta[territoryMapData.territory];

  let territoryFill = "none";
  let territoryFillOpacity = 0;
  const territoryStrokeOpacity = 1;
  if (territoryMeta?.countryID) {
    const ownerCountryID = territoryMeta?.countryID;
    const ownerCountry =
      members.find(({ countryID }) => String(countryID) === ownerCountryID)
        ?.country || "null";
    territoryFill = theme.palette[ownerCountry]?.main;
    territoryFillOpacity = 0.4;
  }
  const curOrder = useAppSelector(gameOrder);
  if (
    territoryMeta?.territory &&
    territoryMeta?.territory === curOrder.toTerritory
  ) {
    territoryFillOpacity = 0.9;
    territoryFill = theme.palette[userCountry].main;
  }

  // Maps unitSlot name -> unit to draw.
  const unitFCs: { [key: string]: React.ReactElement } = {};
  // Maps unitSlot name -> unit to draw, but specifically for units
  // that are currently disloging another unit on a retreat phase.
  // This is separate because we need to draw the
  // dislodger unit in an alternative location when there are two
  // units in a territory so that they don't overlap each other, including
  // when those units share the same unitSlot within that territory.
  const unitFCsDislodging: { [key: string]: React.ReactElement } = {};

  units
    .filter(
      (unit) =>
        (unit.mappedTerritory.parent || unit.mappedTerritory.territory) ===
        territoryMeta?.territory,
    )
    .forEach((unit) => {
      let unitState: UIState = UIState.NONE;
      if (unit.isBuild) {
        unitState = UIState.BUILD;
      }

      const wdUnit = (
        <WDUnit
          id={`${territory}-unit`}
          country={unit.country}
          meta={unit}
          type={unit.unit.type as UnitType}
          iconState={unitState}
        />
      );
      if (unit.isDislodging) {
        unitFCsDislodging[unit.mappedTerritory.unitSlotName] = wdUnit;
      } else {
        unitFCs[unit.mappedTerritory.unitSlotName] = wdUnit;
      }
    });

  const clickAction = function (evt, clickObject: ClickObjectType) {
    dispatch(
      gameApiSliceActions.processMapClick({
        clickObject,
        evt,
        name: territory,
      }),
    );
  };
  return (
    <svg
      height={territoryMapData.height}
      id={`${territory}-territory`}
      viewBox={territoryMapData.viewBox}
      width={territoryMapData.width}
      x={territoryMapData.x}
      y={territoryMapData.y}
    >
      <g onClick={(e) => clickAction(e, "territory")}>
        {territoryMapData.texture?.texture && (
          <path
            d={territoryMapData.path}
            fill={territoryMapData.texture.texture}
            id={`${territory}-texture`}
            stroke={territoryMapData.texture.stroke}
            strokeOpacity={territoryMapData.texture.strokeOpacity}
            strokeWidth={territoryMapData.texture.strokeWidth}
          />
        )}
        <path
          d={territoryMapData.path}
          fill={territoryFill}
          fillOpacity={territoryFillOpacity}
          id={`${territory}-control-path`}
          stroke={theme.palette.primary.main}
          strokeOpacity={1}
          strokeWidth={territoryStrokeOpacity}
        />
      </g>
      {territoryMapData.centerPos && (
        <g className="no-pointer-events">
          <WDCenter
            territory={territory}
            x={territoryMapData.centerPos.x}
            y={territoryMapData.centerPos.y}
          />
        </g>
      )}
      {territoryMapData.labels &&
        territoryMapData.labels.map(({ name, text, style, x, y }, i) => {
          let txt = text;
          const id = `${territory}-label-${name}`;
          if (!txt) {
            txt = territoryMapData.abbr;
          }
          return (
            <g key={id} className="no-pointer-events">
              <WDLabel
                id={id}
                name={name}
                key={id || i}
                style={style}
                text={txt}
                x={x}
                y={y}
              />
            </g>
          );
        })}
      {territoryMapData.unitSlots &&
        territoryMapData.unitSlots
          .filter(({ name }) => name in unitFCs)
          .map(({ name, x, y }) => (
            <WDUnitSlot
              key={name}
              name={name}
              territory={territory}
              x={x}
              y={y}
            >
              {unitFCs[name]}
            </WDUnitSlot>
          ))}
      {territoryMapData.unitSlots &&
        territoryMapData.arrowReceiver &&
        territoryMapData.unitSlots
          .filter(({ name }) => name in unitFCsDislodging)
          .map(({ name }) => {
            const unitName = `${name}-dislodging`;
            // For dislodger units, we draw them at the location of the
            // arrow receiver.
            const arrowReceiver = territoryMapData.arrowReceiver as Coordinates;
            return (
              <WDUnitSlot
                key={unitName}
                name={unitName}
                territory={territory}
                x={arrowReceiver.x - UNIT_WIDTH / 2}
                y={arrowReceiver.y - UNIT_HEIGHT / 2}
              >
                {unitFCsDislodging[name]}
              </WDUnitSlot>
            );
          })}
      {territoryMapData.arrowReceiver && (
        <rect
          id={`${territory}-arrow-receiver`}
          x={territoryMapData.arrowReceiver.x}
          y={territoryMapData.arrowReceiver.y}
          width="1"
          height="1"
        />
      )}
    </svg>
  );
};

export default WDTerritory;
