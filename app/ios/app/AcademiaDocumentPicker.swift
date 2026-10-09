import Foundation
import React
import Security
import UIKit
import UniformTypeIdentifiers
import CryptoKit

@objc(AcademiaDocumentPicker)
final class AcademiaDocumentPicker: NSObject, UIDocumentPickerDelegate {
  private var resolvePromise: RCTPromiseResolveBlock?
  private var rejectPromise: RCTPromiseRejectBlock?

  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc(open:rejecter:)
  func open(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard self.resolvePromise == nil else {
        reject("PICKER_BUSY", "A file picker is already open.", nil)
        return
      }
      guard let presenter = Self.topViewController() else {
        reject("NO_VIEW_CONTROLLER", "The file picker is unavailable right now.", nil)
        return
      }

      self.resolvePromise = resolve
      self.rejectPromise = reject
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .jpeg, .png], asCopy: true)
      picker.delegate = self
      picker.allowsMultipleSelection = false
      presenter.present(picker, animated: true)
    }
  }

  @objc(createPkceChallenge:rejecter:)
  func createPkceChallenge(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    var random = Data(count: 32)
    let randomStatus: OSStatus = random.withUnsafeMutableBytes { buffer in
      guard let baseAddress = buffer.baseAddress else { return errSecParam }
      return SecRandomCopyBytes(kSecRandomDefault, buffer.count, baseAddress)
    }
    guard randomStatus == errSecSuccess else {
      reject("PKCE_ERROR", "Could not prepare secure Google sign-in.", nil)
      return
    }
    let verifier = random.base64URLEncodedString()
    let digest = SHA256.hash(data: Data(verifier.utf8))
    resolve(["verifier": verifier, "challenge": Data(digest).base64URLEncodedString()])
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    finish(with: NSNull())
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let source = urls.first else {
      finish(with: NSNull())
      return
    }

    let hasAccess = source.startAccessingSecurityScopedResource()
    defer { if hasAccess { source.stopAccessingSecurityScopedResource() } }

    do {
      let values = try source.resourceValues(forKeys: [.fileSizeKey, .nameKey])
      guard let size = values.fileSize, size >= 0 else {
        reject("FILE_SIZE_UNAVAILABLE", "Could not determine the selected file size.")
        return
      }
      guard size <= Self.maxFileSize else {
        reject("FILE_TOO_LARGE", "Choose a PDF or image that is 8 MB or smaller.")
        return
      }

      let mimeType = Self.mimeType(for: source)
      guard ["application/pdf", "image/jpeg", "image/png"].contains(mimeType) else {
        reject("UNSUPPORTED_FILE", "Choose a PDF, JPEG, or PNG image.")
        return
      }

      let filename = (values.name ?? source.lastPathComponent).replacingOccurrences(of: "/", with: "_")
      let destination = FileManager.default.temporaryDirectory
        .appendingPathComponent("academia-\(UUID().uuidString)-\(filename)")
      try FileManager.default.copyItem(at: source, to: destination)

      finish(with: [
        "uri": destination.absoluteString,
        "name": filename,
        "type": mimeType,
        "size": size,
      ])
    } catch {
      reject("FILE_READ_ERROR", "Could not read the selected file.")
    }
  }

  private func finish(with value: Any) {
    let resolve = resolvePromise
    resolvePromise = nil
    rejectPromise = nil
    resolve?(value)
  }

  private func reject(_ code: String, _ message: String) {
    let reject = rejectPromise
    resolvePromise = nil
    rejectPromise = nil
    reject?(code, message, nil)
  }

  private static let maxFileSize = 8 * 1024 * 1024

  private static func mimeType(for url: URL) -> String {
    switch UTType(filenameExtension: url.pathExtension)?.preferredMIMEType {
    case "application/pdf": return "application/pdf"
    case "image/jpeg": return "image/jpeg"
    case "image/png": return "image/png"
    default: return ""
    }
  }

  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let root = scenes.flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController
    var current = root
    while let presented = current?.presentedViewController { current = presented }
    return current
  }
}

private extension Data {
  func base64URLEncodedString() -> String {
    base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}
