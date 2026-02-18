import React from 'react'
import { Alert } from 'react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { DocumentsInsightsScreen } from '../documentsInsights'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { useCareerSetupStore } from '../../../store/careerSetup'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockGetDocumentAsync = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}))

jest.spyOn(Alert, 'alert')

describe('DocumentsInsightsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    act(() => {
      useUserProfileStore.getState().resetProfile()
      useCareerSetupStore.getState().resetCareerSetup()
    })
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] })
  })

  it('opens add modal from plus button', () => {
    const { getByTestId } = render(<DocumentsInsightsScreen />)
    fireEvent.press(getByTestId('documents-add-button'))
    expect(getByTestId('documents-upload-modal')).toBeTruthy()
  })

  it('uploads a resume and stores it for insights and ATS flows', async () => {
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: 'Senior_Resume.pdf',
          uri: 'file:///tmp/Senior_Resume.pdf',
          mimeType: 'application/pdf',
        },
      ],
    })

    const { getByTestId } = render(<DocumentsInsightsScreen />)

    fireEvent.press(getByTestId('documents-add-button'))
    fireEvent.press(getByTestId('documents-upload-resume'))

    await waitFor(() => {
      expect(useUserProfileStore.getState().careerDocuments.length).toBe(1)
    })

    expect(useUserProfileStore.getState().careerDocuments[0]).toEqual(
      expect.objectContaining({
        name: 'Senior_Resume.pdf',
        type: 'resume',
        mimeType: 'application/pdf',
      })
    )
    expect(useCareerSetupStore.getState().sourceResumeName).toBe('Senior_Resume.pdf')
  })

  it('uploads a cover letter and can filter to cover letters', async () => {
    mockGetDocumentAsync
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'Backend_Resume.pdf',
            uri: 'file:///tmp/Backend_Resume.pdf',
            mimeType: 'application/pdf',
          },
        ],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'Backend_Cover_Letter.docx',
            uri: 'file:///tmp/Backend_Cover_Letter.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      })

    const { getByTestId, queryByText, getByText } = render(<DocumentsInsightsScreen />)

    fireEvent.press(getByTestId('documents-add-button'))
    fireEvent.press(getByTestId('documents-upload-resume'))
    await waitFor(() => {
      expect(useUserProfileStore.getState().careerDocuments.length).toBe(1)
    })

    fireEvent.press(getByTestId('documents-add-button'))
    fireEvent.press(getByTestId('documents-upload-coverLetter'))
    await waitFor(() => {
      expect(useUserProfileStore.getState().careerDocuments.length).toBe(2)
    })

    fireEvent.press(getByTestId('filter-coverletters-chip'))
    expect(getByText('Backend_Cover_Letter.docx')).toBeTruthy()
    expect(queryByText('Backend_Resume.pdf')).toBeNull()
  })

  it('cycles document status and deletes the document', async () => {
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: 'Product_Resume.pdf',
          uri: 'file:///tmp/Product_Resume.pdf',
          mimeType: 'application/pdf',
        },
      ],
    })

    const { getByTestId } = render(<DocumentsInsightsScreen />)

    fireEvent.press(getByTestId('documents-add-button'))
    fireEvent.press(getByTestId('documents-upload-resume'))

    await waitFor(() => {
      expect(useUserProfileStore.getState().careerDocuments.length).toBe(1)
    })

    const docId = useUserProfileStore.getState().careerDocuments[0].id
    fireEvent.press(getByTestId(`status-cycle-${docId}`))
    expect(useUserProfileStore.getState().careerDocuments[0].status).toBe('interviewing')

    fireEvent.press(getByTestId(`delete-document-${docId}`))
    expect(useUserProfileStore.getState().careerDocuments).toHaveLength(0)
  })

  it('sets an existing resume as source resume from card action', async () => {
    act(() => {
      useUserProfileStore.getState().addCareerDocument({
        name: 'Data_Resume.docx',
        type: 'resume',
        uri: 'file:///tmp/Data_Resume.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        targetLabel: 'Data Engineer • New York, NY',
        track: 'Engineering',
        status: 'applied',
        conversionRate: 0.12,
      })
      useCareerSetupStore.getState().setCareerSetup({ sourceResumeName: 'Old_Resume.pdf' })
    })

    const { getByTestId } = render(<DocumentsInsightsScreen />)
    const docId = useUserProfileStore.getState().careerDocuments[0].id

    fireEvent.press(getByTestId(`use-resume-${docId}`))
    expect(useCareerSetupStore.getState().sourceResumeName).toBe('Data_Resume.docx')
  })
})
