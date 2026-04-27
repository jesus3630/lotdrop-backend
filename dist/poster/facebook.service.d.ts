export interface PostListingPayload {
    title: string;
    price: number;
    description: string;
    location: string;
    condition: string;
    listingType: string;
    images: string[];
    facebookCookie: string;
}
export declare class FacebookService {
    private readonly logger;
    postListing(payload: PostListingPayload): Promise<string>;
    private parseCookies;
    private uploadImages;
    private fillField;
    private selectDropdown;
    private xpathOne;
    private selectFirstSuggestion;
    private clickPublish;
    private delay;
}
