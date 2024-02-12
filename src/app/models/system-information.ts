export enum InfoType {
    BE,
    FE,
}

export interface SystemInformation {
    name: string;
    version: string;
    type: InfoType;
}
