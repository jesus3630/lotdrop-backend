export interface PostListingPayload {
    title: string;
    price: number;
    description: string;
    location: string;
    condition: string;
    listingType: string;
    images: string[];
    facebookCookie: string;
    year?: number;
    make?: string;
    model?: string;
    mileage?: number;
    exteriorColor?: string;
    transmission?: string;
}
export declare class FacebookService {
    private readonly logger;
    postListing(payload: PostListingPayload): Promise<string>;
    private fillItemForm;
    private fillVehicleForm;
    private parseCookies;
    private uploadImages;
    private fillField;
    private fillOrSelectWithSuggestion;
    private fillLocationField;
    private selectDropdown;
    private findOptionByText;
    private selectFirstSuggestion;
    private clickNextOrPublish;
    private delay;
}
