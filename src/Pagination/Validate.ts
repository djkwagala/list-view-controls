import { ReactChild, createElement } from "react";
import { ListView } from "../Shared/SharedUtils";
import { ModelerProps } from "./Pagination";

export interface ValidateConfigProps extends ModelerProps {
    inWebModeler?: boolean;
    queryNode?: HTMLElement | null;
    targetListView?: ListView | null;
}

export class Validate {

    static validate(props: ValidateConfigProps): ReactChild {
        const errorMessages: string[] = [];

        if (props.pagingStyle === "custom") {
            if (props.items.length < 1) {
                errorMessages.push("custom style should have at least one item");
            }
            props.items.forEach(item => {
                if (item.item === "pageNumberButtons" && (!item.maxPageButtons || item.maxPageButtons < 7)) {
                    errorMessages.push("Number of page buttons should 7 or larger");
                }
                if (item.item === "text" && !item.text) {
                    errorMessages.push("Custom item text requires a 'Text with placeholder'");
                }
                const isButton = item.item === "firstButton" || item.item === "lastButton" || item.item === "nextButton" || item.item === "previousButton";
                if (isButton && item.showIcon === "none" && !item.buttonCaption) {
                    errorMessages.push("Custom button requires an caption or icon");
                }
            });
        }

        if (!props.inWebModeler) {
            if (!props.queryNode) {
                errorMessages.push("unable to find a list view on the page");
            }
            if (props.targetListView && !Validate.isCompatible(props.targetListView)) {
                errorMessages.push("this Mendix version is incompatible");
            }
        }

        if (errorMessages.length) {
            return createElement("div", {},
                "Configuration error in widget:",
                errorMessages.map((message, key) => createElement("p", { key }, message))
            );
        }

        return "";
    }

    static isCompatible(targetListView: ListView): boolean {
        return !!(targetListView
            && targetListView._datasource
            && targetListView._datasource.setOffset
            && targetListView._datasource._pageSize !== undefined
            && targetListView._sourceReload
            && targetListView._renderData
            && targetListView._datasource._setSize !== undefined
            && targetListView.update);
    }
}
