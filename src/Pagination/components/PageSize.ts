import { ChangeEvent, Component, createElement } from "react";
import { OptionProps } from "./PageSizeSelect";
export interface PageSizeProps {
    labelText: string;
    currentOffSet?: number;
    initialPageSize?: number;
    listViewSize: number;
    sizeOptions?: OptionProps[];
    handleChange: (OptionProps: OnChangeProps) => void;
}

interface PageSizeState {
    selectedValue?: string;
    currentPageSize: string;
}

export interface OnChangeProps {
    newOffSet: number;
    newPageSize: number;
    newPageNumber: number;
}

// type Display = Partial<OptionProps> & PageSizeState;
export class PageSize extends Component<PageSizeProps, PageSizeState> {
    // private selectorDomNode: HTMLSelectElement;
    // private filters: Display[];

    constructor(props: PageSizeProps) {
        super(props);

        this.state = {
            currentPageSize : props.initialPageSize <= 0 ? "10" : `${props.initialPageSize}`
        };
    }

    render() {
        return createElement("div", { className: "page-size" },
            this.props.labelText ? createElement("label", { }, this.props.labelText) : null,
            createElement("input", {
                className: "form-control",
                onChange: this.handleOnChange,
                value: this.state.currentPageSize
            })
        );
    }

    componentWillReceiveProps(nextProps: PageSizeProps) {
        if (nextProps.initialPageSize !== this.props.initialPageSize && nextProps.initialPageSize !== Number(this.state.currentPageSize)) {
            this.setState({
                currentPageSize: `${nextProps.initialPageSize}`
            });
        }
    }

    shouldComponentUpdate(_nextProps: PageSizeProps, nextState: PageSizeState) {
        return (nextState.currentPageSize !== this.state.currentPageSize);
    }

    private handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { listViewSize, currentOffSet } = this.props;
        const currentPageSize = event.currentTarget.value;
        if (this.state.currentPageSize !== currentPageSize) {
            this.setState({
                currentPageSize
            });
            const newOffSet = this.calculateOffSet(listViewSize, currentOffSet, Number(currentPageSize));
            this.props.handleChange(newOffSet);
        }
    }

    private calculateOffSet = (listViewSize: number, currentOffSet: number, newPageSize: number): OnChangeProps => {
        const numberOfPages = Math.ceil(listViewSize / newPageSize);
        for (let newPageNumber = 0; newPageNumber < numberOfPages; newPageNumber++) {
            const pageOffSet = (newPageNumber * newPageSize);
            if (currentOffSet <= pageOffSet) {
                return {
                    newOffSet: pageOffSet,
                    newPageNumber: ++newPageNumber,
                    newPageSize
                };
            }
        }
    }
}
