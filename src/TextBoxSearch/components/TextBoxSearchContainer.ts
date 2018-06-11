import { Component, ReactElement, createElement } from "react";
import * as dojoConnect from "dojo/_base/connect";
import * as classNames from "classnames";

import { Alert } from "../../Shared/components/Alert";
import { DataSourceHelper } from "../../Shared/DataSourceHelper/DataSourceHelper";
import { GroupedOfflineConstraint, ListView, OfflineConstraint, SharedUtils } from "../../Shared/SharedUtils";

import { TextBoxSearch, TextBoxSearchProps } from "./TextBoxSearch";

interface WrapperProps {
    class: string;
    style: string;
    friendlyId: string;
    mxform: mxui.lib.form._FormBase;
    mxObject: mendix.lib.MxObject;
}

export interface ContainerProps extends WrapperProps {
    attributeList: SearchAttributes[];
    defaultQuery: string;
    entity: string;
    placeHolder: string;
}

export interface SearchAttributes {
    attribute: string;
}

export interface ContainerState {
    alertMessage?: string;
    listViewAvailable: boolean;
    targetListView?: ListView;
    targetNode?: HTMLElement;
    validationPassed?: boolean;
}

export default class SearchContainer extends Component<ContainerProps, ContainerState> {
    private dataSourceHelper: DataSourceHelper;
    private navigationHandler: object;
    private widgetDOM: HTMLElement;

    constructor(props: ContainerProps) {
        super(props);

        this.state = { listViewAvailable: false };

        this.applySearch = this.applySearch.bind(this);
        this.navigationHandler = dojoConnect.connect(props.mxform, "onNavigation", this, this.connectToListView.bind(this));
    }

    componentDidUpdate(_previousProps: ContainerProps, previousState: ContainerState) {
        if (this.state.listViewAvailable && !previousState.listViewAvailable) {
            this.applySearch(this.props.defaultQuery);
        }
    }

    render() {
        return createElement("div", {
                className: classNames("widget-text-box-search", this.props.class),
                ref: (widgetDOM) => this.widgetDOM = widgetDOM,
                style: SharedUtils.parseStyle(this.props.style)
            },
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-text-box-search-alert"
            }, this.state.alertMessage),
            this.renderTextBoxSearch()
        );
    }

    componentWillUnmount() {
        dojoConnect.disconnect(this.navigationHandler);
    }

    private renderTextBoxSearch(): ReactElement<TextBoxSearchProps> | null {
        if (!this.state.alertMessage) {
            return createElement(TextBoxSearch, {
                defaultQuery: this.props.defaultQuery,
                onTextChange: this.applySearch,
                placeholder: this.props.placeHolder
            });
        }

        return null;
    }

    private applySearch(searchQuery: string) {
        // Construct constraint based on search query
        const constraint = this.getConstraint(searchQuery);

        if (this.dataSourceHelper) {
            this.dataSourceHelper.setConstraint(this.props.friendlyId, constraint);
        }
    }

    private getConstraint(searchQuery: string): string | GroupedOfflineConstraint {
        const { targetListView } = this.state;

        searchQuery = searchQuery.trim();

        if (!searchQuery) {
            return "";

        }

        if (window.mx.isOffline()) {
            const offlineConstraints: OfflineConstraint[] = [];
            this.props.attributeList.forEach(search => {
                offlineConstraints.push({
                    attribute: search.attribute,
                    operator: "contains",
                    path: this.props.entity,
                    value: searchQuery
                });
            });

            return {
                constraints: offlineConstraints,
                operator: "or"
            };
        }

        if (targetListView && targetListView._datasource && searchQuery) {
            const constraints: string[] = [];
            const dayInMilliSeconds = 24 * 60 * 60 * 1000;
            this.props.attributeList.forEach(searchAttribute => {
                const { attribute } = searchAttribute;
                if (mx.meta.getEntity(this.props.entity).isDate(attribute)) {
                    let finalDate = window.mx.parser.parseValue(searchQuery, "datetime", { selector: "date" });
                    const isLocalized = mx.meta.getEntity(this.props.entity).isLocalizedDate(attribute);
                    if (finalDate) {
                        if (!isLocalized) {
                            const delocalizedTime = window.mx.parser.delocalizeEpoch(finalDate);
                            finalDate = new Date(delocalizedTime);
                        }
                        const currentDate = finalDate.getTime();
                        const nextDate = finalDate.getTime() + dayInMilliSeconds;
                        const constraint = `(${attribute}>=${currentDate} and ${attribute}<${nextDate})`;
                        constraints.push(constraint);
                    }
                } else {
                    constraints.push(`contains(${attribute},'${searchQuery}')`);
                }
            });

            return constraints.length ? "[" + constraints.join(" or ") + "]" : "";
        }
        return "";
    }

    private connectToListView() {
        let errorMessage = "";
        let targetListView: ListView | undefined;

        try {
            this.dataSourceHelper = DataSourceHelper.getInstance(this.widgetDOM.parentElement, this.props.entity);
            targetListView = this.dataSourceHelper.getListView();
        } catch (error) {
            errorMessage = error.message;
        }

        this.setState({
            alertMessage: errorMessage,
            listViewAvailable: !!targetListView,
            targetListView
        });
    }
}
