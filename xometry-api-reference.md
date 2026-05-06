# Xometry API Reference

This document was generated from public ReadMe reference pages because no directly downloadable OpenAPI document was retrieved.

## Authentication

Set up the welcome page for your API to help users make their first call.

## Base URLs

- No authoritative `servers` list was available without a public OpenAPI document.
- Endpoint paths below are best-effort values taken from visible page content or inferred from ReadMe slugs.

## Endpoints

### Retrieve All Jobs

- Method: `GET`
- Path: `/v0/jobs/`
- Source: https://developer.xometry.com/reference/get_v0-jobs
- Description: Retrieve jobs data

Request parameters:
- `page` (query, optional, integer) - The current page number
- `pageSize` (query, optional, integer) - The numbers of orders returned per page
- `statuses` (query, optional, string) - Filters the orders by statuses

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Live authenticated sample
  - `application/json; charset=utf-8`

```json
{
  "data": {
    "jobs": [
      {
        "guid": "000000000000000000000000",
        "id": "J0000000",
        "status": "progress",
        "dates": {
          "shipBy": "2024-01-01T00:00:00.000Z",
          "due": "2024-01-01T00:00:00.000Z",
          "submitted": "2024-01-01T00:00:00.000Z",
          "completed": null
        },
        "lineItems": [
          {
            "guid": "000000000000000000000000",
            "quantity": 1,
            "requirementsSummary": "string",
            "dangerouslyProvidedAttributes": {
              "requirements": [
                {
                  "label": "string",
                  "value": "string"
                }
              ],
              "specificationDetails": {
                "material": {
                  "id": "000000000000000000000000"
                },
                "finish": {
                  "id": "000000000000000000000000"
                },
                "certifications": [
                  {
                    "id": "000000000000000000000000"
                  }
                ]
              }
            },
            "attributes": {
              "manufacturing": {
                "process": {
                  "id": "string"
                },
                "finish": {
                  "isStandard": false
                }
              },
              "handling": {
                "isExpedite": false,
                "isEconomy": true
              }
            },
            "files": {
              "partFile": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.step",
                  "constructedName": "example.step"
                }
              ],
              "printingStl": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.stl",
                  "constructedName": "example.stl"
                }
              ],
              "thumbnail": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "image/png",
                  "name": "example.png",
                  "constructedName": null
                }
              ],
              "traveler": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/pdf",
                  "name": null,
                  "constructedName": "example.pdf"
                }
              ],
              "streamcacheConversion": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.scs",
                  "constructedName": null
                }
              ],
              "progressPhotos": [],
              "redactedDrawings": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.pdf",
                  "constructedName": null
                }
              ],
              "requiredInspectionReports": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.pdf",
                  "constructedName": null
                }
              ],
              "submittedInspectionReports": [],
              "requiredCertificationReports": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.pdf",
                  "constructedName": null
                }
              ],
              "submittedCertificationReports": [
                {
                  "href": "https://api.developer.xometry.com/redacted",
                  "type": "application/octet-stream",
                  "name": "example.pdf",
                  "constructedName": null
                }
              ]
            },
            "isItar": true,
            "rawDimensions": {
              "x": 1,
              "y": 1,
              "z": 1,
              "units": "string"
            },
            "volume": 1,
            "partId": "string",
            "finish": {
              "name": "string"
            },
            "material": {
              "name": "string"
            }
          }
        ],
        "files": {
          "inventoryList": [
            {
              "href": "https://api.developer.xometry.com/redacted",
              "type": "application/pdf"
            }
          ],
          "purchaseOrder": [
            {
              "href": "https://api.developer.xometry.com/redacted",
              "type": "application/pdf"
            }
          ]
        },
        "price": 1,
        "shipToCountry": "US",
        "hasVqc": false,
        "repeatJobs": [],
        "notes": null,
        "shippingDetails": [
          {
            "method": "GROUND",
            "service": "string",
            "partIds": [
              "000000000000000000000000"
            ],
            "city": "string",
            "province": null,
            "country": "US",
            "zipcode": "00000"
          }
        ]
      }
    ]
  },
  "info": {
    "statusCode": 1,
    "url": "string",
    "method": "GET",
    "message": "string"
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/jobs/'
```

Notes:
- Description includes the public search index excerpt.
- Response example was sampled live from the authenticated API via `/v0/jobs/?statuses=progress&pageSize=1` and then anonymized.

### Retrieve Single Job

- Method: `GET`
- Path: `/v0/jobs/{id}`
- Source: https://developer.xometry.com/reference/get_v0-jobs-id
- Description: Retrieve job data

Request parameters:
- `id` (path, required, string) - Job id or guid

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Live authenticated sample
  - `application/json; charset=utf-8`

```json
{
  "data": {
    "job": {
      "guid": "000000000000000000000000",
      "id": "J0000000",
      "status": "progress",
      "dates": {
        "shipBy": "2024-01-01T00:00:00.000Z",
        "due": "2024-01-01T00:00:00.000Z",
        "submitted": "2024-01-01T00:00:00.000Z",
        "completed": null
      },
      "lineItems": [
        {
          "guid": "000000000000000000000000",
          "quantity": 1,
          "requirementsSummary": "string",
          "dangerouslyProvidedAttributes": {
            "requirements": [
              {
                "label": "string",
                "value": "string"
              }
            ],
            "specificationDetails": {
              "material": {
                "id": "000000000000000000000000"
              },
              "finish": {
                "id": "000000000000000000000000"
              },
              "certifications": [
                {
                  "id": "000000000000000000000000"
                }
              ]
            }
          },
          "attributes": {
            "manufacturing": {
              "process": {
                "id": "string"
              },
              "finish": {
                "isStandard": false
              }
            },
            "handling": {
              "isExpedite": false,
              "isEconomy": true
            }
          },
          "files": {
            "partFile": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.step",
                "constructedName": "example.step"
              }
            ],
            "printingStl": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.stl",
                "constructedName": "example.stl"
              }
            ],
            "thumbnail": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "image/png",
                "name": "example.png",
                "constructedName": null
              }
            ],
            "traveler": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/pdf",
                "name": null,
                "constructedName": "example.pdf"
              }
            ],
            "streamcacheConversion": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.scs",
                "constructedName": null
              }
            ],
            "progressPhotos": [],
            "redactedDrawings": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.pdf",
                "constructedName": null
              }
            ],
            "requiredInspectionReports": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.pdf",
                "constructedName": null
              }
            ],
            "submittedInspectionReports": [],
            "requiredCertificationReports": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.pdf",
                "constructedName": null
              }
            ],
            "submittedCertificationReports": [
              {
                "href": "https://api.developer.xometry.com/redacted",
                "type": "application/octet-stream",
                "name": "example.pdf",
                "constructedName": null
              }
            ]
          },
          "isItar": true,
          "rawDimensions": {
            "x": 1,
            "y": 1,
            "z": 1,
            "units": "string"
          },
          "volume": 1,
          "partId": "string",
          "finish": {
            "name": "string"
          },
          "material": {
            "name": "string"
          },
          "workflows": [
            {
              "guid": "000000000000000000000000",
              "tasks": [
                {
                  "guid": "000000000000000000000000",
                  "name": "string",
                  "status": "complete"
                }
              ]
            }
          ]
        }
      ],
      "files": {
        "inventoryList": [
          {
            "href": "https://api.developer.xometry.com/redacted",
            "type": "application/pdf"
          }
        ],
        "purchaseOrder": [
          {
            "href": "https://api.developer.xometry.com/redacted",
            "type": "application/pdf"
          }
        ]
      },
      "price": 1,
      "shipToCountry": "US",
      "hasVqc": false,
      "repeatJobs": [],
      "notes": null,
      "shippingDetails": [
        {
          "method": "GROUND",
          "service": "string",
          "partIds": [
            "000000000000000000000000"
          ],
          "city": "string",
          "province": null,
          "country": "US",
          "zipcode": "00000"
        }
      ],
      "milestones": [
        {
          "name": "string",
          "status": "complete"
        }
      ]
    }
  },
  "info": {
    "statusCode": 1,
    "url": "string",
    "method": "GET",
    "message": "string"
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/jobs/{id}'
```

Notes:
- Description includes the public search index excerpt.
- Response example was sampled live from the authenticated API via `/v0/jobs/J03B2672` and then anonymized.

### Update Single Job

- Method: `PATCH`
- Path: `/v0/jobs/{id}`
- Source: https://developer.xometry.com/reference/patch_v0-jobs-id
- Description: Update a job. Note: updating production notes via this route will remove all current styling and upload the input as plain text

Request parameters:
- `id` (path, required, string) - Job id or guid

Request body schemas:
- `application/json`

```json
{
  "notes": "string"
}
```

Response schemas:
- `202`: Job was successfully updated
  - `application/json`

```json
{
  "data": {
    "job": {
      "guid": "string",
      "id": "string",
      "status": "incomplete",
      "dates": {
        "shipBy": "string",
        "due": "string",
        "submitted": "string",
        "completed": "string"
      },
      "lineItems": [
        {
          "guid": "string",
          "quantity": 1,
          "requirementsSummary": "string",
          "dangerouslyProvidedAttributes": {
            "requirements": [
              {
                "label": "string",
                "value": "string"
              }
            ],
            "specificationDetails": {
              "material": {
                "id": "string"
              },
              "finish": {
                "id": "string"
              },
              "certifications": [
                {
                  "id": "string"
                }
              ]
            }
          },
          "attributes": {
            "manufacturing": {
              "process": {
                "id": "string"
              },
              "finish": {
                "isStandard": false
              }
            },
            "handling": {
              "isExpedite": false,
              "isEconomy": false
            }
          },
          "files": {
            "partFile": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "printingStl": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "thumbnail": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "traveler": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "streamcacheConversion": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "drawings": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "progressPhotos": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "redactedDrawings": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "requiredInspectionReports": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "submittedInspectionReports": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "requiredCertificationReports": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ],
            "submittedCertificationReports": [
              {
                "href": "string",
                "type": "string",
                "name": "string",
                "constructedName": "string"
              }
            ]
          },
          "isItar": false,
          "rawDimensions": {
            "x": 1,
            "y": 1,
            "z": 1,
            "units": "string"
          },
          "volume": 1,
          "partId": "string",
          "finish": {
            "name": "string"
          },
          "material": {
            "name": "string"
          },
          "workflows": [
            {
              "guid": "string",
              "tasks": [
                {
                  "guid": "string",
                  "name": "string",
                  "status": "progress"
                }
              ]
            }
          ]
        }
      ],
      "files": {
        "inventoryList": [
          {
            "href": "string",
            "type": "string",
            "name": "string",
            "constructedName": "string"
          }
        ],
        "purchaseOrder": [
          {
            "href": "string",
            "type": "string",
            "name": "string",
            "constructedName": "string"
          }
        ]
      },
      "price": 1,
      "shipToCountry": "string",
      "hasVqc": false,
      "repeatJobs": [
        "string"
      ],
      "notes": "string",
      "shippingDetails": [
        {
          "method": "string",
          "service": "string",
          "partIds": [
            "string"
          ],
          "city": "string",
          "state": "string",
          "province": "string",
          "country": "string",
          "zipcode": "string"
        }
      ],
      "milestones": [
        {
          "name": "string",
          "status": "progress"
        }
      ]
    }
  }
}
```

Example curl:

```bash
curl -X PATCH 'https://developer.xometry.com/v0/jobs/{id}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Line Item File with File Type

- Method: `GET`
- Path: `/v0/jobs/{id}/{fileType}`
- Source: https://developer.xometry.com/reference/get_v0-jobs-id-filetype
- Description: Retrieve Job File by File Type

Request parameters:
- `id` (path, required, string) - Job id or guid
- `fileType` (path, required, string) - Extracted from the embedded ReadMe OpenAPI fragment.

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Live authenticated sample
  - `application/pdf`

```json
{
  "binary": true,
  "contentType": "application/pdf",
  "contentLength": 96879,
  "signature": "%PDF"
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/jobs/{id}/{fileType}'
```

Notes:
- Description includes the public search index excerpt.
- Response example was sampled live from the authenticated API via `/v0/jobs/J03B2672/inventory`; this route returned binary content so the example captures observed headers and file signature instead of file bytes.

### Update a job's milestone

- Method: `POST`
- Path: `/v0/jobs/{id}/advance-milestone`
- Source: https://developer.xometry.com/reference/post_v0-jobs-id-advance-milestone
- Description: Update a job's milestone. If there are intermediary subtasks that must be resolved, tasks will be set to "In Progress".

Request parameters:
- `id` (path, required, string) - Job id or guid

Request body schemas:
- `application/json`

```json
{
  "targetMilestone": "string"
}
```

Response schemas:
- `204`: Milestone was successfully updated
  - No response body content declared.

Example curl:

```bash
curl -X POST 'https://developer.xometry.com/v0/jobs/{id}/advance-milestone'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Line Item File with File Type

- Method: `GET`
- Path: `/v0/jobs/{id}/line-items/{lineItemId}/{fileType}`
- Source: https://developer.xometry.com/reference/get_v0-jobs-id-line-items-lineitemid-filetype
- Description: Retrieve Line Item File by File Type

Request parameters:
- `id` (path, required, string) - Job id or guid
- `lineItemId` (path, required, string) - Line item guid
- `fileType` (path, required, string) - Type of file

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Live authenticated sample
  - `application/octet-stream`

```json
{
  "binary": true,
  "contentType": "application/octet-stream",
  "contentLength": 539339,
  "signature": "49534f2d31303330"
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/jobs/{id}/line-items/{lineItemId}/{fileType}'
```

Notes:
- Description includes the public search index excerpt.
- Response example was sampled live from the authenticated API via `/v0/jobs/J03B2672/line-items/69b05287e50afb95b9e630f4/part-file`; this route returned binary content so the example captures observed headers and file signature instead of file bytes.

### Line Item File by File ID

- Method: `GET`
- Path: `/v0/jobs/{id}/line-items/{lineItemId}/{fileType}/{fileId}`
- Source: https://developer.xometry.com/reference/get_v0-jobs-id-line-items-lineitemid-filetype-fileid
- Description: Retrieve Line Item File with File Id

Request parameters:
- `id` (path, required, string) - Job id or guid
- `lineItemId` (path, required, string) - Line item guid
- `fileType` (path, required, string) - Type of file
- `fileId` (path, required, string) - Identifier of file

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Live authenticated sample
  - `application/pdf`

```json
{
  "binary": true,
  "contentType": "application/pdf",
  "contentLength": 109281,
  "signature": "%PDF"
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/jobs/{id}/line-items/{lineItemId}/{fileType}/{fileId}'
```

Notes:
- Description includes the public search index excerpt.
- Response example was sampled live from the authenticated API via `/v0/jobs/J03B2672/line-items/69b05287e50afb95b9e630f4/redacted-drawings/0`; this route returned binary content so the example captures observed headers and file signature instead of file bytes.

### Advance a line item's status

- Method: `POST`
- Path: `/v0/jobs/{id}/line-items/{lineItemId}/advance-status`
- Source: https://developer.xometry.com/reference/post_v0-jobs-id-line-items-lineitemid-advance-status
- Description: Advance a line item's status. If there are intermediary subtasks that must be resolved, tasks will be set to "In Progress".

Request parameters:
- `id` (path, required, string) - Job id or guid
- `lineItemId` (path, required, string) - Line item guid

Request body schemas:
- `application/json`

```json
{
  "targetTask": {
    "guid": "string",
    "status": "progress"
  }
}
```

Response schemas:
- `204`: Line item task status was successfully updated
  - No response body content declared.

Example curl:

```bash
curl -X POST 'https://developer.xometry.com/v0/jobs/{id}/line-items/{lineItemId}/advance-status'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Retrieve All Offers

- Method: `GET`
- Path: `/v0/offers/`
- Source: https://developer.xometry.com/reference/get_v0-offers
- Description: Retrieve available offers

Request parameters:
- None declared.

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Successfully retrieved available offers
  - `application/json`

```json
{
  "data": {
    "offers": [
      {
        "price": "string",
        "dueDate": "string",
        "expirationDate": "string",
        "exclusive": false,
        "repeat": false,
        "revised": false,
        "job": {
          "id": "string",
          "lineItems": [
            {
              "id": "string",
              "name": "string",
              "isItar": false,
              "isExpedited": false,
              "isEconomy": false,
              "certificationRequirements": [
                {
                  "id": "string",
                  "name": "string"
                }
              ],
              "fulfillmentRequirements": {
                "manufacturing": {
                  "process": {
                    "id": "string"
                  },
                  "finish": {
                    "isStandard": false
                  }
                },
                "handling": {
                  "isExpedite": false,
                  "isEconomy": false
                }
              },
              "quantity": 1,
              "process": "string",
              "material": {
                "name": "string"
              },
              "inspectionRequirement": "string",
              "finish": {
                "name": "string"
              },
              "files": {
                "partFile": [
                  {
                    "href": "string",
                    "type": "string",
                    "name": "string",
                    "constructedName": "string"
                  }
                ],
                "printingStl": [
                  {
                    "href": "string",
                    "type": "string",
                    "name": "string",
                    "constructedName": "string"
                  }
                ],
                "thumbnail": [
                  {
                    "href": "string",
                    "type": "string",
                    "name": "string",
                    "constructedName": "string"
                  }
                ],
                "redactedDrawings": [
                  {
                    "href": "string",
                    "type": "string",
                    "name": "string",
                    "constructedName": "string"
                  }
                ]
              },
              "requirementsSummary": "string",
              "dangerouslyProvidedAttributes": {
                "material": {
                  "id": "string"
                },
                "finish": {
                  "id": "string"
                },
                "requirements": [
                  {
                    "label": "string",
                    "value": "string"
                  }
                ]
              },
              "rawDimensions": {
                "x": 1,
                "y": 1,
                "z": 1,
                "units": "string"
              }
            }
          ]
        }
      }
    ]
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/offers/'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe for `/v0/offers/?pageSize=1` returned HTTP 401. Token missing the following scopes: offer:read Falling back to embedded docs data for the success response shape.

### Accept an Offer

- Method: `POST`
- Path: `/v0/offers/{offerId}/accept`
- Source: https://developer.xometry.com/reference/post_v0-offers-offerid-accept
- Description: Accept an Offer.

Request parameters:
- `offerId` (path, required, string) - Offer id

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Offer {offerId} accepted
  - No response body content declared.

Example curl:

```bash
curl -X POST 'https://developer.xometry.com/v0/offers/{offerId}/accept'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Line Item File with File Type

- Method: `GET`
- Path: `/v0/offers/{offerId}/line-items/{lineItemId}/{fileType}`
- Source: https://developer.xometry.com/reference/get_v0-offers-offerid-line-items-lineitemid-filetype
- Description: Retrieve Line Item File by File Type

Request parameters:
- `offerId` (path, required, string) - Offer id
- `lineItemId` (path, required, string) - Line item guid
- `fileType` (path, required, string) - Type of file

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Successful response
  - No response body content declared.

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/offers/{offerId}/line-items/{lineItemId}/{fileType}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe skipped: current token did not expose offer-scoped sample ids.

### Line Item File by File ID

- Method: `GET`
- Path: `/v0/offers/{offerId}/line-items/{lineItemId}/{fileType}/{fileId}`
- Source: https://developer.xometry.com/reference/get_v0-offers-offerid-line-items-lineitemid-filetype-fileid
- Description: Retrieve Line Item File with File Id

Request parameters:
- `offerId` (path, required, string) - Offer id
- `lineItemId` (path, required, string) - Line item guid
- `fileType` (path, required, string) - Type of file
- `fileId` (path, required, string) - Identifier of file

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Successful response
  - No response body content declared.

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/offers/{offerId}/line-items/{lineItemId}/{fileType}/{fileId}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe skipped: current token did not expose offer-scoped sample ids.

### Reject an Offer

- Method: `POST`
- Path: `/v0/offers/{offerId}/reject`
- Source: https://developer.xometry.com/reference/post_v0-offers-offerid-reject
- Description: Reject an Offer.

Request parameters:
- `offerId` (path, required, string) - Offer id

Request body schemas:
- `application/json`

```json
{
  "rejectionReason": {
    "priceTooLow": {
      "materialCost": false,
      "orientationCost": false,
      "toolingCost": false,
      "costDoesntReflectReprintRisk": false,
      "costNotes": "string",
      "acceptablePrice": 1
    },
    "leadTimeTooShort": {
      "atCapacity": false,
      "riskyGeometry": false,
      "buildTimeExceedsLeadTime": false,
      "acceptableShipDate": "2/20/2024",
      "leadTimeNotes": "string"
    },
    "manufacturability": {
      "wallThickness": false,
      "smallFeatures": false,
      "warpRisk": false,
      "poorlyDesignedThreads": false,
      "poorMaterialChoice": false,
      "doesntFitTechnology": false,
      "outsideOfCapabilities": false,
      "manufacturabilityNotes": "string"
    },
    "phoneNumber": "string"
  }
}
```

Response schemas:
- `200`: Offer {offerId} rejected
  - No response body content declared.

Example curl:

```bash
curl -X POST 'https://developer.xometry.com/v0/offers/{offerId}/reject'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Retrieve Webhooks

- Method: `GET`
- Path: `/v0/webhooks/`
- Source: https://developer.xometry.com/reference/get_v0-webhooks
- Description: Retrieve webhooks created for an orgainzation

Request parameters:
- `skip` (query, optional, integer) - The number of items to skip before starting to collect the result set
- `limit` (query, optional, integer) - The numbers of items to return

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Retrieved Webhooks
  - `application/json`

```json
{
  "data": {
    "webhooks": [
      {
        "state": "active",
        "events": [
          "job.created"
        ],
        "url": "https://api.example.com/webhook-callback",
        "name": "string",
        "metadata": {},
        "guid": "string",
        "orgId": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "archived": false
      }
    ]
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/webhooks/'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe for `/v0/webhooks/?limit=1` returned HTTP 401. Error: Token not provided or malformed. Falling back to embedded docs data for the success response shape.

### Create Webhook

- Method: `POST`
- Path: `/v0/webhooks/`
- Source: https://developer.xometry.com/reference/post_v0-webhooks
- Description: Create a new webhook to send workcenter events to

Request parameters:
- None declared.

Request body schemas:
- `application/json`

```json
{
  "state": "active",
  "events": [
    "job.created"
  ],
  "url": "https://api.example.com/webhook-callback",
  "name": "string",
  "metadata": {}
}
```

Response schemas:
- `201`: Webhook Created
  - `application/json`

```json
{
  "data": {
    "webhook": {
      "state": "active",
      "events": [
        "job.created"
      ],
      "url": "https://api.example.com/webhook-callback",
      "name": "string",
      "metadata": {},
      "guid": "string",
      "orgId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "archived": false
    }
  }
}
```

Example curl:

```bash
curl -X POST 'https://developer.xometry.com/v0/webhooks/'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Unarchive Webhook

- Method: `PATCH`
- Path: `/v0/webhooks/:id/unarchive`
- Source: https://developer.xometry.com/reference/patch_v0-webhooks-id-unarchive
- Description: Unarchive an existing archived webhook

Request parameters:
- None declared.

Request body schemas:
- `application/json`
  - No example or schema payload available.

Response schemas:
- `200`: Webhook Unarchived
  - `application/json`

```json
{
  "data": {
    "webhook": {
      "state": "active",
      "events": [
        "job.created"
      ],
      "url": "https://api.example.com/webhook-callback",
      "name": "string",
      "metadata": {},
      "guid": "string",
      "orgId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "archived": false
    }
  }
}
```

Example curl:

```bash
curl -X PATCH 'https://developer.xometry.com/v0/webhooks/{id}/unarchive'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Archive Webhook

- Method: `DELETE`
- Path: `/v0/webhooks/{webhookId}`
- Source: https://developer.xometry.com/reference/delete_v0-webhooks-webhookid
- Description: Archive an existing webhook

Request parameters:
- `webhookId` (path, required, integer) - The unique webhook id

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Webhook archived
  - `application/json`

```json
{
  "data": {
    "webhook": {
      "state": "active",
      "events": [
        "job.created"
      ],
      "url": "https://api.example.com/webhook-callback",
      "name": "string",
      "metadata": {},
      "guid": "string",
      "orgId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "archived": false
    }
  }
}
```

Example curl:

```bash
curl -X DELETE 'https://developer.xometry.com/v0/webhooks/{webhookId}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped for mutating endpoint.

### Retrieve Webhook

- Method: `GET`
- Path: `/v0/webhooks/{webhookId}`
- Source: https://developer.xometry.com/reference/get_v0-webhooks-webhookid
- Description: Retrieve webhook by id

Request parameters:
- `webhookId` (path, required, integer) - The unique webhook id

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Retrieved Webhooks
  - `application/json`

```json
{
  "data": {
    "webhook": {
      "state": "active",
      "events": [
        "job.created"
      ],
      "url": "https://api.example.com/webhook-callback",
      "name": "string",
      "metadata": {},
      "guid": "string",
      "orgId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "archived": false
    }
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/webhooks/{webhookId}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe skipped: current token did not expose webhook-scoped sample ids.

### Retrieve Webhook Events

- Method: `GET`
- Path: `/v0/webhooks/events/`
- Source: https://developer.xometry.com/reference/get_v0-webhooks-events
- Description: Retrieve webhook events created for an orgainzation

Request parameters:
- `skip` (query, optional, integer) - The number of items to skip before starting to collect the result set
- `limit` (query, optional, integer) - The numbers of items to return
- `webhookId` (query, optional, string) - The webhookId the webhook events are associated to
- `eventType` (query, optional, string) - The event type the webhook events are triggered by
- `sortBy` (query, optional, string) - The webhook event field to sort result by
- `sortDirection` (query, optional, string) - The sort direction to apply to sortBy parameter

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Retrieved Webhook Events
  - `application/json`

```json
{
  "data": {
    "webhookEvents": [
      {
        "orgId": "string",
        "webhookId": "string",
        "userId": "string",
        "status": "queued",
        "metadata": {
          "numberOfRetries": 1,
          "retryTimestamp": 1
        },
        "updatedBy": "webhook-delivery-outbound-service",
        "payload": {},
        "response": {
          "status": 1,
          "errorMessage": "string"
        },
        "event": "job.created",
        "url": "string",
        "guid": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/webhooks/events/'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe for `/v0/webhooks/events/?limit=1` returned HTTP 401. Error: Token not provided or malformed. Falling back to embedded docs data for the success response shape.

### Retrieve Webhook Event

- Method: `GET`
- Path: `/v0/webhooks/events/{webhookEventId}`
- Source: https://developer.xometry.com/reference/get_v0-webhooks-events-webhookeventid
- Description: Retrieve webhook event by id

Request parameters:
- `webhookEventId` (path, required, integer) - The unique webhook event id

Request body schemas:
- No request body declared.

Response schemas:
- `200`: Retrieved Webhook Event
  - `application/json`

```json
{
  "data": {
    "webhookEvent": {
      "orgId": "string",
      "webhookId": "string",
      "userId": "string",
      "status": "queued",
      "metadata": {
        "numberOfRetries": 1,
        "retryTimestamp": 1
      },
      "updatedBy": "webhook-delivery-outbound-service",
      "payload": {},
      "response": {
        "status": 1,
        "errorMessage": "string"
      },
      "event": "job.created",
      "url": "string",
      "guid": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/webhooks/events/{webhookEventId}'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe skipped: current token did not expose webhook event ids.

### Retry Webhook Event

- Method: `GET`
- Path: `/v0/webhooks/events/{webhookEventId}/retry`
- Source: https://developer.xometry.com/reference/get_v0-webhooks-events-webhookeventid-retry
- Description: Retry webhook event by id

Request parameters:
- `webhookEventId` (path, required, integer) - The unique webhook event id

Request body schemas:
- No request body declared.

Response schemas:
- `202`: Retry Webhook Event
  - `application/json`

```json
{}
```

Example curl:

```bash
curl -X GET 'https://developer.xometry.com/v0/webhooks/events/{webhookEventId}/retry'
```

Notes:
- Description includes the public search index excerpt.
- Response bodies were materialized from the embedded response schemas when literal examples were absent.
- Live probe intentionally skipped because this GET route triggers a retry side effect.
