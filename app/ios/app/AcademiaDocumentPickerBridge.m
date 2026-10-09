#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AcademiaDocumentPicker, NSObject)
RCT_EXTERN_METHOD(open:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createPkceChallenge:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
